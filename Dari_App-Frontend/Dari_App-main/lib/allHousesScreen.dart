import 'package:flutter/material.dart';
import 'package:dari_version_complete/api_service.dart';
import 'package:dari_version_complete/addHomeScreen.dart';
import 'package:dari_version_complete/homeScreen.dart';
import 'package:dari_version_complete/loginScreen.dart';

class AllHousesScreen extends StatefulWidget {
  @override
  _AllHousesScreenState createState() => _AllHousesScreenState();
}

class _AllHousesScreenState extends State<AllHousesScreen> {
  List<dynamic> houses = [];
  List<dynamic> filteredHouses = [];
  int _selectedIndex = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchHouses();
  }

  Future<void> _fetchHouses() async {
    try {
      final fetchedHouses = await ApiService.fetchAllHouses();
      setState(() {
        houses = fetchedHouses;
        filteredHouses = fetchedHouses; // Initially display all houses
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load houses: $e')),
      );
    }
  }

  void filterHouses(String query) {
    setState(() {
      filteredHouses = houses.where((house) {
        final title = house['title']?.toLowerCase() ?? '';
        final location = house['location']?.toLowerCase() ?? '';
        final searchLower = query.toLowerCase();
        return title.contains(searchLower) || location.contains(searchLower);
      }).toList();
    });
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });

    switch (_selectedIndex) {
      case 0:
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => HomeScreen()),
        );
        break;
      case 2:
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => AddHomeScreen()),
        );
        break;
      case 3:
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => LoginScreen()),
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      extendBody: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color.fromARGB(144, 159, 237, 251),
                  Color.fromARGB(255, 67, 214, 255),
                ],
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 15),
                    child: TextField(
                      onChanged: filterHouses,
                      decoration: InputDecoration(
                        hintText: 'Search for a home',
                        border: InputBorder.none,
                        icon: Icon(Icons.search, color: Colors.grey),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: filteredHouses.length,
                    itemBuilder: (context, index) {
                      final house = filteredHouses[index];

                      return GestureDetector(
                        onTap: () {
                          // Show the bottom sheet with house details
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (BuildContext context) {
                              return Container(
                                height: MediaQuery.of(context).size.height * 0.68,
                                decoration: BoxDecoration(
                                  color: Color.fromARGB(174, 159, 237, 251),
                                  borderRadius: BorderRadius.only(
                                    topLeft: Radius.circular(20),
                                    topRight: Radius.circular(20),
                                  ),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        house['title'] ?? 'No title',
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      SizedBox(height: 10),
                                      Text(
                                        house['location'] ?? 'No location',
                                        style: TextStyle(
                                          fontSize: 16,
                                          color: Colors.grey,
                                        ),
                                      ),
                                      SizedBox(height: 10),
                                      Expanded(
                                        child: Image.network(
                                          house['images']?[0] ?? '',
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      SizedBox(height: 10),
                                      Text(
                                        house['description'] ?? 'No description available',
                                        style: TextStyle(fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          );
                        },
                        child: Container(
                          margin: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                          padding: EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(15),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.withOpacity(0.3),
                                blurRadius: 10,
                                spreadRadius: 5,
                                offset: Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  house['images']?[0] ?? '',
                                  height: 80,
                                  width: 80,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      house['title'] ?? 'No title',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(height: 5),
                                    Text(
                                      house['location'] ?? 'No location',
                                      style: TextStyle(color: Colors.grey[600]),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        margin: EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              spreadRadius: 5,
              blurRadius: 15,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: BottomNavigationBar(
            backgroundColor: const Color.fromARGB(255, 143, 42, 42),
            selectedItemColor: Colors.blueAccent,
            unselectedItemColor: const Color.fromARGB(255, 141, 139, 139),
            currentIndex: _selectedIndex,
            onTap: _onItemTapped,
            showSelectedLabels: true,
            showUnselectedLabels: false,
            items: [
              BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
              BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
              BottomNavigationBarItem(icon: Icon(Icons.add_circle_outline), label: 'Add'),
              BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
            ],
            selectedFontSize: 15.0,
            unselectedFontSize: 15.0,
            iconSize: 25.0,
          ),
        ),
      ),
    );
  }
}
