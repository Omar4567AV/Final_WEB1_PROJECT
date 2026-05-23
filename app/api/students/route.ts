import { NextResponse } from 'next/server';
import { Student } from '@/types';

// Mock database storage array
const mockStudentsDb: Student[] = [
  { id: '1', name: 'Habib Sankary', email: 'habib@university.edu', role: 'STUDENT', createdAt: new Date().toISOString() },
  { id: '2', name: 'Alex Smith', email: 'alex@university.edu', role: 'STUDENT', createdAt: new Date().toISOString() }
];

// 1. GET Handle: Returns all students from the system
export async function GET() {
  try {
    return NextResponse.json(
      { success: true, data: mockStudentsDb },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error fetching students" },
      { status: 500 }
    );
  }
}

// 2. POST Handle: Receives data from a client and simulates adding a new student
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    // Simple validation
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: name or email" },
        { status: 400 }
      );
    }

    // Map body to our strict global Student interface
    const newStudent: Student = {
      id: Math.floor(Math.random() * 1000).toString(),
      name,
      email,
      role: 'STUDENT',
      createdAt: new Date().toISOString()
    };

    console.log('API Server received new record payload:', newStudent);
    
    // In a real database setup, you would execute:
    // await db.student.create({ data: newStudent })

    return NextResponse.json(
      { success: true, data: newStudent, message: "Student registered successfully inside API router" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid JSON format payload received" },
      { status: 400 }
    );
  }
}
