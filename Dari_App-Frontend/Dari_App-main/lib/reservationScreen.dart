import 'package:flutter/material.dart';
import 'package:dari_version_complete/api_service.dart';
//import 'package:home_location/paymentScreen.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:dari_version_complete/addHomeScreen.dart';
import 'package:dari_version_complete/allHousesScreen.dart';
import 'package:dari_version_complete/loginScreen.dart';

class ReservationScreen extends StatefulWidget {
  final String houseId;

  ReservationScreen({required this.houseId});

  @override
  _ReservationPageState createState() => _ReservationPageState();
}

class _ReservationPageState extends State<ReservationScreen> {
  DateTime? _startDate;
  DateTime? _endDate;
  DateTime _focusedDay = DateTime.now();
  int _selectedIndex = 0;
  bool _isLoading = false;

  Future<void> _handleReservation() async {
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner les dates de début et de fin')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final result = await ApiService.reserveHouse(
      houseId: widget.houseId,
      checkInDate: _startDate!,
      checkOutDate: _endDate!,
    );

    setState(() {
      _isLoading = false;
    });

    if (result['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Réservation réussie : ${result['message']}')),
      );

      // Navigate to Payment Screen
     /* Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => PaymentScreen()),
      );*/
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : ${result['message']}')),
      );
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
      body: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color.fromARGB(174, 159, 237, 251),
              const Color.fromARGB(218, 79, 214, 251),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(height: 20),
              Text('Choisir une date de réservation', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              SizedBox(height: 20),
              TableCalendar(
                firstDay: DateTime.utc(2020, 1, 1),
                lastDay: DateTime.utc(2030, 12, 31),
                focusedDay: _focusedDay,
                selectedDayPredicate: (day) => isSameDay(_startDate, day) || isSameDay(_endDate, day),
                onDaySelected: (selectedDay, focusedDay) {
                  setState(() {
                    if (_startDate == null || (_endDate != null && selectedDay.isBefore(_startDate!))) {
                      _startDate = selectedDay;
                      _endDate = null; // Reset end date
                    } else if (_endDate == null && selectedDay.isAfter(_startDate!)) {
                      _endDate = selectedDay;
                    } else if (selectedDay.isBefore(_startDate!)) {
                      _startDate = selectedDay;
                    }
                    _focusedDay = focusedDay;
                  });
                },
                calendarStyle: CalendarStyle(
                  selectedDecoration:
                  BoxDecoration(color: Colors.blueAccent, shape: BoxShape.circle),
                  todayDecoration:
                  BoxDecoration(color: Colors.orangeAccent, shape: BoxShape.circle),
                  defaultDecoration:
                  BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                ),
              ),
              SizedBox(height: 20),
              Text(
                'Date de début : ${_startDate?.toLocal().toString().split(' ')[0] ?? 'Non sélectionnée'}',
                style: TextStyle(fontSize: 18, fontStyle: FontStyle.italic, color: Colors.blueAccent),
              ),
              SizedBox(height: 10),
              Text(
                'Date de fin : ${_endDate?.toLocal().toString().split(' ')[0] ?? 'Non sélectionnée'}',
                style: TextStyle(fontSize: 18, fontStyle: FontStyle.italic, color: Colors.blueAccent),
              ),
              SizedBox(height: 20),
              _isLoading
                  ? CircularProgressIndicator()
                  : ElevatedButton(
                onPressed: _handleReservation,
                child: Text('Payer'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                  textStyle: TextStyle(fontSize: 18),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      margin: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.2), spreadRadius: 5, blurRadius: 15),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(30),
        child: BottomNavigationBar(
          backgroundColor: const Color.fromARGB(255, 101, 25, 25),
          selectedItemColor: Colors.blueAccent,
          unselectedItemColor: const Color.fromARGB(255, 141, 139, 139),
          currentIndex: _selectedIndex,
          onTap: (index) {
            setState(() {
              _selectedIndex = index;
            });
            switch (_selectedIndex) {
              case 0:
                Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => ReservationScreen(houseId: widget.houseId)));
                break;
              case 1:
                Navigator.push(context, MaterialPageRoute(builder: (context) => AllHousesScreen()));
                break;
              case 2:
                Navigator.push(context, MaterialPageRoute(builder: (context) => AddHomeScreen()));
                break;
              case 3:
                Navigator.push(context, MaterialPageRoute(builder: (context) => LoginScreen()));
                break;
              default:
                print('Index non valide: $_selectedIndex');
            }
          },
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
    );
  }
}
