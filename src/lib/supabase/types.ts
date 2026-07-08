export type Role = "student" | "teacher";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: Role;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: Role;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: Role;
          created_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          level: string;
          image_url: string | null;
          published: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          level: string;
          image_url?: string | null;
          published?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          level?: string;
          image_url?: string | null;
          published?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          content: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          content?: string | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          content?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          lesson_id: string;
          type: string;
          question: string;
          correct_answer: string | null;
          options: string[] | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          type: string;
          question: string;
          correct_answer?: string | null;
          options?: string[] | null;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          type?: string;
          question?: string;
          correct_answer?: string | null;
          options?: string[] | null;
          order_index?: number;
          created_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          exercise_id: string;
          student_id: string;
          answer: string;
          comment: string | null;
          reviewed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          student_id: string;
          answer: string;
          comment?: string | null;
          reviewed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          student_id?: string;
          answer?: string;
          comment?: string | null;
          reviewed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          paid: boolean;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          paid?: boolean;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          paid?: boolean;
          enrolled_at?: string;
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          student_id: string;
          lesson_id: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          lesson_id: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          lesson_id?: string;
          completed?: boolean;
          completed_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
