export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_type: string
          created_at: string
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          slot: string
          start_date: string | null
          target_url: string | null
          video_url: string | null
        }
        Insert: {
          ad_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          slot: string
          start_date?: string | null
          target_url?: string | null
          video_url?: string | null
        }
        Update: {
          ad_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          slot?: string
          start_date?: string | null
          target_url?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      app_releases: {
        Row: {
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          version: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          version: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          version?: string
        }
        Relationships: []
      }
      article_comments: {
        Row: {
          article_id: string
          author_country: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          ip_hash: string | null
          is_hidden: boolean
          likes: number
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          article_id: string
          author_country?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          is_hidden?: boolean
          likes?: number
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          author_country?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          is_hidden?: boolean
          likes?: number
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      article_entities: {
        Row: {
          article_id: string
          created_at: string
          entity_name: string
          entity_slug: string
          id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          entity_name: string
          entity_slug: string
          id?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          entity_name?: string
          entity_slug?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_entities_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_view_events: {
        Row: {
          article_id: string
          created_at: string
          id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_view_events_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          ai_rewritten: boolean
          category_id: string | null
          content: string
          content_hash: string | null
          created_at: string
          focus_keyword: string | null
          governorate: string | null
          id: string
          image_alt: string | null
          image_caption: string | null
          image_url: string | null
          images: Json
          is_breaking: boolean
          is_pinned: boolean
          is_published: boolean
          keywords: string[] | null
          last_merged_at: string | null
          merged_from_count: number
          organizations: string[] | null
          persons: string[] | null
          places: string[] | null
          seo_description: string | null
          seo_title: string | null
          short_id: number
          source_name: string | null
          source_url: string | null
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          ai_rewritten?: boolean
          category_id?: string | null
          content: string
          content_hash?: string | null
          created_at?: string
          focus_keyword?: string | null
          governorate?: string | null
          id?: string
          image_alt?: string | null
          image_caption?: string | null
          image_url?: string | null
          images?: Json
          is_breaking?: boolean
          is_pinned?: boolean
          is_published?: boolean
          keywords?: string[] | null
          last_merged_at?: string | null
          merged_from_count?: number
          organizations?: string[] | null
          persons?: string[] | null
          places?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          short_id?: number
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          ai_rewritten?: boolean
          category_id?: string | null
          content?: string
          content_hash?: string | null
          created_at?: string
          focus_keyword?: string | null
          governorate?: string | null
          id?: string
          image_alt?: string | null
          image_caption?: string | null
          image_url?: string | null
          images?: Json
          is_breaking?: boolean
          is_pinned?: boolean
          is_published?: boolean
          keywords?: string[] | null
          last_merged_at?: string | null
          merged_from_count?: number
          organizations?: string[] | null
          persons?: string[] | null
          places?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          short_id?: number
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          email: string
          id: string
          ip: string | null
          message: string
          name: string
          source: string
          status: string
          subject: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          message: string
          name: string
          source?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          message?: string
          name?: string
          source?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      news_fetch_log: {
        Row: {
          created_at: string
          error: string | null
          id: number
          items_found: number | null
          items_inserted: number | null
          items_skipped: number | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: number
          items_found?: number | null
          items_inserted?: number | null
          items_skipped?: number | null
          source: string
          status: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: number
          items_found?: number | null
          items_inserted?: number | null
          items_skipped?: number | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      news_merge_log: {
        Row: {
          added_content_length: number | null
          article_id: string | null
          created_at: string
          id: string
          reason: string | null
          similarity: number | null
          source_name: string | null
          source_url: string | null
        }
        Insert: {
          added_content_length?: number | null
          article_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          similarity?: number | null
          source_name?: string | null
          source_url?: string | null
        }
        Update: {
          added_content_length?: number | null
          article_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          similarity?: number | null
          source_name?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_merge_log_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources_health: {
        Row: {
          consecutive_failures: number
          id: string
          last_error: string | null
          last_run_at: string | null
          source: string
          status: string
          total_inserted: number
          total_runs: number
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          source: string
          status?: string
          total_inserted?: number
          total_runs?: number
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          source?: string
          status?: string
          total_inserted?: number
          total_runs?: number
          updated_at?: string
        }
        Relationships: []
      }
      prep_results_2026: {
        Row: {
          administration: string | null
          arabic: string | null
          art: string | null
          computer: string | null
          created_at: string
          english: string | null
          id: number
          math: string | null
          religion: string | null
          school: string | null
          science: string | null
          seat_number: number
          student_name: string
          studies: string | null
          total: number | null
        }
        Insert: {
          administration?: string | null
          arabic?: string | null
          art?: string | null
          computer?: string | null
          created_at?: string
          english?: string | null
          id?: number
          math?: string | null
          religion?: string | null
          school?: string | null
          science?: string | null
          seat_number: number
          student_name: string
          studies?: string | null
          total?: number | null
        }
        Update: {
          administration?: string | null
          arabic?: string | null
          art?: string | null
          computer?: string | null
          created_at?: string
          english?: string | null
          id?: number
          math?: string | null
          religion?: string | null
          school?: string | null
          science?: string | null
          seat_number?: number
          student_name?: string
          studies?: string | null
          total?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          fingerprint: string | null
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          fingerprint?: string | null
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          fingerprint?: string | null
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      suggested_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          occurrences: number
          reason: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          occurrences?: number
          reason?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          occurrences?: number
          reason?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_all_article_sources: { Args: never; Returns: number }
      clean_article_sources: { Args: { _txt: string }; Returns: string }
      ensure_category: {
        Args: { p_name: string; p_slug: string }
        Returns: string
      }
      find_similar_article: {
        Args: {
          _content: string
          _days?: number
          _threshold?: number
          _title: string
        }
        Returns: {
          id: string
          similarity: number
          title: string
        }[]
      }
      infer_article_category: {
        Args: { _content: string; _title: string }
        Returns: string
      }
      infer_governorate: { Args: { _txt: string }; Returns: string }
      infer_tags: { Args: { _txt: string }; Returns: string[] }
      like_comment: { Args: { _id: string }; Returns: number }
      phase2_dashboard_stats: { Args: never; Returns: Json }
      recategorize_all_articles: { Args: never; Returns: number }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
