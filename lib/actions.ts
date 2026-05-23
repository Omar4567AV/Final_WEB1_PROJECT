'use server'

import { revalidatePath } from 'next/cache';

// Mock Database Insertion (SSR Layer)
export async function createStudent(formData: FormData) {
  const name = formData.get('studentName');
  const email = formData.get('studentEmail');

  console.log('Writing to DB securely on Server:', { name, email });

  // Refresh the SSR cache so the table shows the new student immediately
  revalidatePath('/admin/students');
}
