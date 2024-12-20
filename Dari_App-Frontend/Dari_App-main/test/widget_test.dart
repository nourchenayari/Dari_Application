import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:dari_version_complete/loginScreen.dart';

void main() {
  testWidgets('Login screen renders and accepts input', (WidgetTester tester) async {
    // Build the LoginScreen and trigger a frame.
    await tester.pumpWidget(
      MaterialApp(
        home: LoginScreen(),
      ),
    );

    // Verify that the email and password text fields are present.
    expect(find.byType(TextField), findsNWidgets(2)); // 2 TextFields (email, password)
    expect(find.text('Email'), findsOneWidget); // Email label
    expect(find.text('Password'), findsOneWidget); // Password label

    // Verify that the login button is present.
    expect(find.text('Login'), findsOneWidget);

    // Enter email and password.
    await tester.enterText(find.byType(TextField).at(0), 'test@example.com'); // Email
    await tester.enterText(find.byType(TextField).at(1), 'password123'); // Password

    // Verify that the entered text is correct.
    expect(find.text('test@example.com'), findsOneWidget);
    expect(find.text('password123'), findsOneWidget);

    // Tap the login button.
    await tester.tap(find.text('Login'));
    await tester.pump();

    // Verify UI changes after tapping the button, if applicable.
    // This part depends on the next screen or functionality.
    // You can mock API calls or add navigation checks here.
  });
}
