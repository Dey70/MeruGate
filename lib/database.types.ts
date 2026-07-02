// Hand-written to match supabase/migrations/0001_schema.sql.
// No live Supabase project is linked yet to run `supabase gen types` against;
// regenerate with `npx supabase gen types typescript --project-id <ref> --schema public`
// once one exists, and diff against this file.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      syllabi: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          syllabus_id: string;
          subject: string;
          title: string;
          month: number;
          week_number: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          syllabus_id: string;
          subject: string;
          title: string;
          month: number;
          week_number: number;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          syllabus_id?: string;
          subject?: string;
          title?: string;
          month?: number;
          week_number?: number;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_topic_progress: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          completed: boolean;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string;
          completed?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      squads: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      squad_invites: {
        Row: {
          id: string;
          squad_id: string;
          code: string;
          created_by: string | null;
          created_at: string;
          expires_at: string | null;
          max_uses: number | null;
          uses_count: number;
        };
        Insert: {
          id?: string;
          squad_id: string;
          code: string;
          created_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
          max_uses?: number | null;
          uses_count?: number;
        };
        Update: {
          id?: string;
          squad_id?: string;
          code?: string;
          created_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
          max_uses?: number | null;
          uses_count?: number;
        };
        Relationships: [];
      };
      squad_members: {
        Row: {
          id: string;
          squad_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          squad_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          squad_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          content_md: string;
          notion_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          content_md?: string;
          notion_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string;
          content_md?: string;
          notion_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          period_type: "weekly" | "monthly";
          period_start: string;
          target_topic_count: number;
          subject: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_type: "weekly" | "monthly";
          period_start: string;
          target_topic_count: number;
          subject?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_type?: "weekly" | "monthly";
          period_start?: string;
          target_topic_count?: number;
          subject?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_history: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          topic_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          topic_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          role?: "user" | "assistant";
          content?: string;
          topic_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_topic_schedule: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          month: number;
          week_number: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          month: number;
          week_number: number;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string;
          month?: number;
          week_number?: number;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      user_activity_days: {
        Row: {
          user_id: string;
          activity_date: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      my_squad_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      create_squad: {
        Args: { squad_name: string };
        Returns: string;
      };
      redeem_invite: {
        Args: { invite_code: string };
        Returns: string;
      };
      replace_user_schedule: {
        Args: { entries: Json };
        Returns: undefined;
      };
      squad_topic_counts: {
        Args: Record<string, never>;
        Returns: { user_id: string; topic_count: number }[];
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
