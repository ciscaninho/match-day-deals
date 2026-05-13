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
      admin_actions: {
        Row: {
          created_at: string
          created_by: string
          error: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          kind: string
          payload: Json
          preview: Json
          result: Json
          status: string
          thread_id: string | null
          undo_payload: Json | null
        }
        Insert: {
          created_at?: string
          created_by: string
          error?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          kind: string
          payload?: Json
          preview?: Json
          result?: Json
          status?: string
          thread_id?: string | null
          undo_payload?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string
          error?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          kind?: string
          payload?: Json
          preview?: Json
          result?: Json
          status?: string
          thread_id?: string | null
          undo_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "admin_assistant_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_assistant_messages: {
        Row: {
          action_id: string | null
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          action_id?: string | null
          content?: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          action_id?: string | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_assistant_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "admin_assistant_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_assistant_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_settings: {
        Row: {
          display_name: string
          email_subject: string
          enabled: boolean
          escalation_enabled: boolean
          fallback_message: string
          faq_seed: string
          greeting: string
          id: number
          support_email: string
          updated_at: string
        }
        Insert: {
          display_name?: string
          email_subject?: string
          enabled?: boolean
          escalation_enabled?: boolean
          fallback_message?: string
          faq_seed?: string
          greeting?: string
          id?: number
          support_email?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          email_subject?: string
          enabled?: boolean
          escalation_enabled?: boolean
          fallback_message?: string
          faq_seed?: string
          greeting?: string
          id?: number
          support_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      club_duplicate_dismissals: {
        Row: {
          created_at: string
          dismissed_by: string | null
          id: string
          kind: string
          reason: string | null
          slug_a: string
          slug_b: string
        }
        Insert: {
          created_at?: string
          dismissed_by?: string | null
          id?: string
          kind?: string
          reason?: string | null
          slug_a: string
          slug_b: string
        }
        Update: {
          created_at?: string
          dismissed_by?: string | null
          id?: string
          kind?: string
          reason?: string | null
          slug_a?: string
          slug_b?: string
        }
        Relationships: []
      }
      club_ticketing_profiles: {
        Row: {
          aliases: string[]
          archived_at: string | null
          archived_into_club_id: string | null
          archived_into_slug: string | null
          archived_reason: string | null
          average_difficulty: string
          ballot_notes: string | null
          ballot_system: boolean
          best_matches: string | null
          city: string | null
          club_name: string
          country: string | null
          created_at: string
          hero_image_url: string | null
          hospitality_available: boolean
          hospitality_url: string | null
          id: string
          important_restrictions: string | null
          last_verified_at: string | null
          league: string | null
          local_fan_restrictions: string | null
          logo_url: string | null
          membership_name: string | null
          membership_required: boolean
          membership_required_for_big_games: boolean
          notes: string | null
          official_ticketing_url: string | null
          official_website: string | null
          public_sale_possible: boolean
          queue_system: string | null
          resale_exchange_available: boolean
          resale_exchange_name: string | null
          resale_exchange_url: string | null
          seo_description: string | null
          seo_title: string | null
          short_name: string | null
          slug: string
          stadium_name: string | null
          stadium_slug: string | null
          ticket_release_process: string | null
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          archived_at?: string | null
          archived_into_club_id?: string | null
          archived_into_slug?: string | null
          archived_reason?: string | null
          average_difficulty?: string
          ballot_notes?: string | null
          ballot_system?: boolean
          best_matches?: string | null
          city?: string | null
          club_name: string
          country?: string | null
          created_at?: string
          hero_image_url?: string | null
          hospitality_available?: boolean
          hospitality_url?: string | null
          id?: string
          important_restrictions?: string | null
          last_verified_at?: string | null
          league?: string | null
          local_fan_restrictions?: string | null
          logo_url?: string | null
          membership_name?: string | null
          membership_required?: boolean
          membership_required_for_big_games?: boolean
          notes?: string | null
          official_ticketing_url?: string | null
          official_website?: string | null
          public_sale_possible?: boolean
          queue_system?: string | null
          resale_exchange_available?: boolean
          resale_exchange_name?: string | null
          resale_exchange_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_name?: string | null
          slug: string
          stadium_name?: string | null
          stadium_slug?: string | null
          ticket_release_process?: string | null
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          archived_at?: string | null
          archived_into_club_id?: string | null
          archived_into_slug?: string | null
          archived_reason?: string | null
          average_difficulty?: string
          ballot_notes?: string | null
          ballot_system?: boolean
          best_matches?: string | null
          city?: string | null
          club_name?: string
          country?: string | null
          created_at?: string
          hero_image_url?: string | null
          hospitality_available?: boolean
          hospitality_url?: string | null
          id?: string
          important_restrictions?: string | null
          last_verified_at?: string | null
          league?: string | null
          local_fan_restrictions?: string | null
          logo_url?: string | null
          membership_name?: string | null
          membership_required?: boolean
          membership_required_for_big_games?: boolean
          notes?: string | null
          official_ticketing_url?: string | null
          official_website?: string | null
          public_sale_possible?: boolean
          queue_system?: string | null
          resale_exchange_available?: boolean
          resale_exchange_name?: string | null
          resale_exchange_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_name?: string | null
          slug?: string
          stadium_name?: string | null
          stadium_slug?: string | null
          ticket_release_process?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_logo: string | null
          away_short: string
          away_team: string
          category: string | null
          city: string
          competition: string
          country: string
          created_at: string
          data_source: string | null
          date: string
          featured: boolean
          home_logo: string | null
          home_short: string
          home_team: string
          id: string
          last_synced_at: string | null
          official_link: string | null
          priority: boolean
          sportmonks_id: number | null
          stadium: string
          starting_price: number | null
          ticket_release_date: string | null
          ticket_sources: Json
          ticket_status: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          away_logo?: string | null
          away_short: string
          away_team: string
          category?: string | null
          city?: string
          competition: string
          country?: string
          created_at?: string
          data_source?: string | null
          date: string
          featured?: boolean
          home_logo?: string | null
          home_short: string
          home_team: string
          id: string
          last_synced_at?: string | null
          official_link?: string | null
          priority?: boolean
          sportmonks_id?: number | null
          stadium?: string
          starting_price?: number | null
          ticket_release_date?: string | null
          ticket_sources?: Json
          ticket_status?: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          away_logo?: string | null
          away_short?: string
          away_team?: string
          category?: string | null
          city?: string
          competition?: string
          country?: string
          created_at?: string
          data_source?: string | null
          date?: string
          featured?: boolean
          home_logo?: string | null
          home_short?: string
          home_team?: string
          id?: string
          last_synced_at?: string | null
          official_link?: string | null
          priority?: boolean
          sportmonks_id?: number | null
          stadium?: string
          starting_price?: number | null
          ticket_release_date?: string | null
          ticket_sources?: Json
          ticket_status?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          favorite_atmosphere: string | null
          favorite_stadium_slug: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          favorite_atmosphere?: string | null
          favorite_stadium_slug?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          favorite_atmosphere?: string | null
          favorite_stadium_slug?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_matches: {
        Row: {
          alerts_enabled: boolean
          created_at: string
          id: string
          match_id: string
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          match_id: string
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          match_id?: string
          user_id?: string
        }
        Relationships: []
      }
      stadium_experience_tips: {
        Row: {
          category: string
          created_at: string
          id: string
          stadium_slug: string
          tip: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          stadium_slug: string
          tip: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          stadium_slug?: string
          tip?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: []
      }
      stadium_image_staging: {
        Row: {
          atmosphere_tags: string[]
          background_image_url: string | null
          capacity: number | null
          city: string | null
          club: string | null
          confidence: string
          country: string | null
          created_at: string
          description: string | null
          hero_image_url: string | null
          id: string
          latitude: number | null
          league: string | null
          longitude: number | null
          match_type: string
          official_website: string | null
          published_stadium_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string | null
          stadium_name: string
          status: string
          suggested_stadium_id: string | null
          thumbnail_image_url: string | null
          year_opened: number | null
        }
        Insert: {
          atmosphere_tags?: string[]
          background_image_url?: string | null
          capacity?: number | null
          city?: string | null
          club?: string | null
          confidence?: string
          country?: string | null
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          latitude?: number | null
          league?: string | null
          longitude?: number | null
          match_type?: string
          official_website?: string | null
          published_stadium_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string | null
          stadium_name: string
          status?: string
          suggested_stadium_id?: string | null
          thumbnail_image_url?: string | null
          year_opened?: number | null
        }
        Update: {
          atmosphere_tags?: string[]
          background_image_url?: string | null
          capacity?: number | null
          city?: string | null
          club?: string | null
          confidence?: string
          country?: string | null
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          latitude?: number | null
          league?: string | null
          longitude?: number | null
          match_type?: string
          official_website?: string | null
          published_stadium_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string | null
          stadium_name?: string
          status?: string
          suggested_stadium_id?: string | null
          thumbnail_image_url?: string | null
          year_opened?: number | null
        }
        Relationships: []
      }
      stadium_media_history: {
        Row: {
          action: string
          candidates: Json
          created_at: string
          destination_path: string | null
          destination_public_url: string | null
          drive_file_id: string | null
          drive_file_name: string
          drive_image_height: number | null
          drive_image_width: number | null
          drive_mime_type: string | null
          drive_size_bytes: number | null
          drive_thumbnail_link: string | null
          id: string
          import_id: string | null
          manual_stadium_id: string | null
          match_confidence: string
          match_type: string
          matched_stadium_id: string | null
          matched_stadium_name: string | null
          matched_stadium_slug: string | null
          normalized_name: string | null
          notes: string | null
          previous_image_url: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          would_overwrite: boolean
        }
        Insert: {
          action?: string
          candidates?: Json
          created_at?: string
          destination_path?: string | null
          destination_public_url?: string | null
          drive_file_id?: string | null
          drive_file_name: string
          drive_image_height?: number | null
          drive_image_width?: number | null
          drive_mime_type?: string | null
          drive_size_bytes?: number | null
          drive_thumbnail_link?: string | null
          id?: string
          import_id?: string | null
          manual_stadium_id?: string | null
          match_confidence?: string
          match_type?: string
          matched_stadium_id?: string | null
          matched_stadium_name?: string | null
          matched_stadium_slug?: string | null
          normalized_name?: string | null
          notes?: string | null
          previous_image_url?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          would_overwrite?: boolean
        }
        Update: {
          action?: string
          candidates?: Json
          created_at?: string
          destination_path?: string | null
          destination_public_url?: string | null
          drive_file_id?: string | null
          drive_file_name?: string
          drive_image_height?: number | null
          drive_image_width?: number | null
          drive_mime_type?: string | null
          drive_size_bytes?: number | null
          drive_thumbnail_link?: string | null
          id?: string
          import_id?: string | null
          manual_stadium_id?: string | null
          match_confidence?: string
          match_type?: string
          matched_stadium_id?: string | null
          matched_stadium_name?: string | null
          matched_stadium_slug?: string | null
          normalized_name?: string | null
          notes?: string | null
          previous_image_url?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          would_overwrite?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "stadium_media_history_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "stadium_media_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      stadium_media_imports: {
        Row: {
          ambiguous_count: number
          created_at: string
          dry_run: boolean
          duplicate_count: number
          error_message: string | null
          finished_at: string | null
          folder_id: string | null
          id: string
          imported_count: number
          matched_count: number
          report: Json
          source: string
          status: string
          total_files: number
          triggered_by: string | null
          unmatched_count: number
          would_overwrite_count: number
        }
        Insert: {
          ambiguous_count?: number
          created_at?: string
          dry_run?: boolean
          duplicate_count?: number
          error_message?: string | null
          finished_at?: string | null
          folder_id?: string | null
          id?: string
          imported_count?: number
          matched_count?: number
          report?: Json
          source?: string
          status?: string
          total_files?: number
          triggered_by?: string | null
          unmatched_count?: number
          would_overwrite_count?: number
        }
        Update: {
          ambiguous_count?: number
          created_at?: string
          dry_run?: boolean
          duplicate_count?: number
          error_message?: string | null
          finished_at?: string | null
          folder_id?: string | null
          id?: string
          imported_count?: number
          matched_count?: number
          report?: Json
          source?: string
          status?: string
          total_files?: number
          triggered_by?: string | null
          unmatched_count?: number
          would_overwrite_count?: number
        }
        Relationships: []
      }
      stadium_reviews: {
        Row: {
          accessibility: number
          atmosphere: number
          comment: string | null
          created_at: string
          facilities: number
          id: string
          section: string | null
          stadium_name: string
          stadium_slug: string
          updated_at: string
          user_id: string
          value: number
          view_rating: number
        }
        Insert: {
          accessibility: number
          atmosphere: number
          comment?: string | null
          created_at?: string
          facilities: number
          id?: string
          section?: string | null
          stadium_name: string
          stadium_slug: string
          updated_at?: string
          user_id: string
          value: number
          view_rating: number
        }
        Update: {
          accessibility?: number
          atmosphere?: number
          comment?: string | null
          created_at?: string
          facilities?: number
          id?: string
          section?: string | null
          stadium_name?: string
          stadium_slug?: string
          updated_at?: string
          user_id?: string
          value?: number
          view_rating?: number
        }
        Relationships: []
      }
      stadium_suggestions: {
        Row: {
          city: string | null
          club: string | null
          country: string | null
          created_at: string
          id: string
          league: string | null
          notes: string | null
          resulting_stadium_slug: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          stadium_name: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          club?: string | null
          country?: string | null
          created_at?: string
          id?: string
          league?: string | null
          notes?: string | null
          resulting_stadium_slug?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stadium_name: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          club?: string | null
          country?: string | null
          created_at?: string
          id?: string
          league?: string | null
          notes?: string | null
          resulting_stadium_slug?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stadium_name?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stadium_tips: {
        Row: {
          created_at: string
          id: string
          stadium_slug: string
          tip: string
          upvotes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stadium_slug: string
          tip: string
          upvotes?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stadium_slug?: string
          tip?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: []
      }
      stadium_visits: {
        Row: {
          atmosphere_rating: number | null
          city: string | null
          country: string | null
          created_at: string
          favorite_section: string | null
          id: string
          match_id: string | null
          match_label: string | null
          notes: string | null
          overall_rating: number | null
          stadium_name: string
          stadium_slug: string
          updated_at: string
          user_id: string
          visit_date: string | null
        }
        Insert: {
          atmosphere_rating?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          favorite_section?: string | null
          id?: string
          match_id?: string | null
          match_label?: string | null
          notes?: string | null
          overall_rating?: number | null
          stadium_name: string
          stadium_slug: string
          updated_at?: string
          user_id: string
          visit_date?: string | null
        }
        Update: {
          atmosphere_rating?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          favorite_section?: string | null
          id?: string
          match_id?: string | null
          match_label?: string | null
          notes?: string | null
          overall_rating?: number | null
          stadium_name?: string
          stadium_slug?: string
          updated_at?: string
          user_id?: string
          visit_date?: string | null
        }
        Relationships: []
      }
      stadiums: {
        Row: {
          accessibility_score: number | null
          aliases: string[]
          archived_at: string | null
          archived_into_slug: string | null
          archived_into_stadium_id: string | null
          archived_reason: string | null
          atmosphere_score: number | null
          background_image_url: string | null
          best_sections: string[] | null
          capacity: number | null
          city: string
          club_name: string | null
          clubs: string[]
          continent: string | null
          country: string
          created_at: string
          description: string | null
          family_friendly_score: number | null
          family_section: string | null
          gallery_images: string[]
          hero_image_url: string | null
          id: string
          image_url: string | null
          latitude: number | null
          league: string
          league_slug: string | null
          longitude: number | null
          official_ticket_provider: string | null
          opened_year: number | null
          popularity_score: number | null
          slug: string
          stadium_name: string
          thumbnail_image_url: string | null
          ultras_section: string | null
          updated_at: string
          value_score: number | null
          vip_available: boolean
        }
        Insert: {
          accessibility_score?: number | null
          aliases?: string[]
          archived_at?: string | null
          archived_into_slug?: string | null
          archived_into_stadium_id?: string | null
          archived_reason?: string | null
          atmosphere_score?: number | null
          background_image_url?: string | null
          best_sections?: string[] | null
          capacity?: number | null
          city: string
          club_name?: string | null
          clubs?: string[]
          continent?: string | null
          country: string
          created_at?: string
          description?: string | null
          family_friendly_score?: number | null
          family_section?: string | null
          gallery_images?: string[]
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          league: string
          league_slug?: string | null
          longitude?: number | null
          official_ticket_provider?: string | null
          opened_year?: number | null
          popularity_score?: number | null
          slug: string
          stadium_name: string
          thumbnail_image_url?: string | null
          ultras_section?: string | null
          updated_at?: string
          value_score?: number | null
          vip_available?: boolean
        }
        Update: {
          accessibility_score?: number | null
          aliases?: string[]
          archived_at?: string | null
          archived_into_slug?: string | null
          archived_into_stadium_id?: string | null
          archived_reason?: string | null
          atmosphere_score?: number | null
          background_image_url?: string | null
          best_sections?: string[] | null
          capacity?: number | null
          city?: string
          club_name?: string | null
          clubs?: string[]
          continent?: string | null
          country?: string
          created_at?: string
          description?: string | null
          family_friendly_score?: number | null
          family_section?: string | null
          gallery_images?: string[]
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          league?: string
          league_slug?: string | null
          longitude?: number | null
          official_ticket_provider?: string | null
          opened_year?: number | null
          popularity_score?: number | null
          slug?: string
          stadium_name?: string
          thumbnail_image_url?: string | null
          ultras_section?: string | null
          updated_at?: string
          value_score?: number | null
          vip_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "stadiums_archived_into_stadium_id_fkey"
            columns: ["archived_into_stadium_id"]
            isOneToOne: false
            referencedRelation: "stadiums"
            referencedColumns: ["id"]
          },
        ]
      }
      stadiums_master_staging: {
        Row: {
          aliases: string[]
          background_image_url: string | null
          canonical_name: string
          capacity: number | null
          city: string | null
          club_names: string[]
          confidence: string
          conflict_flags: string[]
          country: string | null
          created_at: string
          dedupe_cluster_id: string | null
          description: string | null
          duplicate_of: string | null
          has_missing_metadata: boolean
          hero_image_url: string | null
          id: string
          image_score: number
          is_historic: boolean
          is_inactive: boolean
          is_multi_club: boolean
          is_national_team_stadium: boolean
          latitude: number | null
          league: string | null
          longitude: number | null
          normalized_city: string | null
          normalized_country: string | null
          normalized_name: string
          normalized_slug: string
          official_website: string | null
          primary_club: string | null
          production_stadium_id: string | null
          review_notes: string | null
          slug: string
          source_ids: Json
          sources: string[]
          status: string
          thumbnail_image_url: string | null
          updated_at: string
          year_opened: number | null
        }
        Insert: {
          aliases?: string[]
          background_image_url?: string | null
          canonical_name: string
          capacity?: number | null
          city?: string | null
          club_names?: string[]
          confidence?: string
          conflict_flags?: string[]
          country?: string | null
          created_at?: string
          dedupe_cluster_id?: string | null
          description?: string | null
          duplicate_of?: string | null
          has_missing_metadata?: boolean
          hero_image_url?: string | null
          id?: string
          image_score?: number
          is_historic?: boolean
          is_inactive?: boolean
          is_multi_club?: boolean
          is_national_team_stadium?: boolean
          latitude?: number | null
          league?: string | null
          longitude?: number | null
          normalized_city?: string | null
          normalized_country?: string | null
          normalized_name: string
          normalized_slug: string
          official_website?: string | null
          primary_club?: string | null
          production_stadium_id?: string | null
          review_notes?: string | null
          slug: string
          source_ids?: Json
          sources?: string[]
          status?: string
          thumbnail_image_url?: string | null
          updated_at?: string
          year_opened?: number | null
        }
        Update: {
          aliases?: string[]
          background_image_url?: string | null
          canonical_name?: string
          capacity?: number | null
          city?: string | null
          club_names?: string[]
          confidence?: string
          conflict_flags?: string[]
          country?: string | null
          created_at?: string
          dedupe_cluster_id?: string | null
          description?: string | null
          duplicate_of?: string | null
          has_missing_metadata?: boolean
          hero_image_url?: string | null
          id?: string
          image_score?: number
          is_historic?: boolean
          is_inactive?: boolean
          is_multi_club?: boolean
          is_national_team_stadium?: boolean
          latitude?: number | null
          league?: string | null
          longitude?: number | null
          normalized_city?: string | null
          normalized_country?: string | null
          normalized_name?: string
          normalized_slug?: string
          official_website?: string | null
          primary_club?: string | null
          production_stadium_id?: string | null
          review_notes?: string | null
          slug?: string
          source_ids?: Json
          sources?: string[]
          status?: string
          thumbnail_image_url?: string | null
          updated_at?: string
          year_opened?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_escalations: {
        Row: {
          created_at: string
          current_page: string | null
          email_sent: boolean
          escalation_status: string
          id: string
          language: string | null
          related_match_id: string | null
          related_match_name: string | null
          user_id: string | null
          user_message: string
          user_type: string | null
        }
        Insert: {
          created_at?: string
          current_page?: string | null
          email_sent?: boolean
          escalation_status?: string
          id?: string
          language?: string | null
          related_match_id?: string | null
          related_match_name?: string | null
          user_id?: string | null
          user_message: string
          user_type?: string | null
        }
        Update: {
          created_at?: string
          current_page?: string | null
          email_sent?: boolean
          escalation_status?: string
          id?: string
          language?: string | null
          related_match_id?: string | null
          related_match_name?: string | null
          user_id?: string | null
          user_message?: string
          user_type?: string | null
        }
        Relationships: []
      }
      ticket_offers: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          id: string
          in_stock: boolean
          last_checked_at: string
          match_id: string
          price: number | null
          provider: string
          provider_logo: string | null
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          in_stock?: boolean
          last_checked_at?: string
          match_id: string
          price?: number | null
          provider: string
          provider_logo?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          in_stock?: boolean
          last_checked_at?: string
          match_id?: string
          price?: number | null
          provider?: string
          provider_logo?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_offers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          alert_preferences: Json
          created_at: string
          dream_stadium_slug: string | null
          favorite_leagues: string[]
          favorite_teams: string[]
          id: string
          matchday_style: string | null
          onboarding_completed: boolean
          onboarding_skipped_at: string | null
          stadiums_visited_bucket: string | null
          updated_at: string
          user_id: string
          user_intent: string[]
        }
        Insert: {
          alert_preferences?: Json
          created_at?: string
          dream_stadium_slug?: string | null
          favorite_leagues?: string[]
          favorite_teams?: string[]
          id?: string
          matchday_style?: string | null
          onboarding_completed?: boolean
          onboarding_skipped_at?: string | null
          stadiums_visited_bucket?: string | null
          updated_at?: string
          user_id: string
          user_intent?: string[]
        }
        Update: {
          alert_preferences?: Json
          created_at?: string
          dream_stadium_slug?: string | null
          favorite_leagues?: string[]
          favorite_teams?: string[]
          id?: string
          matchday_style?: string | null
          onboarding_completed?: boolean
          onboarding_skipped_at?: string | null
          stadiums_visited_bucket?: string | null
          updated_at?: string
          user_id?: string
          user_intent?: string[]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      merge_club_records: {
        Args: {
          p_canonical_slug: string
          p_duplicate_slug: string
          p_reason?: string
        }
        Returns: Json
      }
      merge_stadium_records: {
        Args: {
          p_canonical_slug: string
          p_duplicate_slug: string
          p_reason?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
