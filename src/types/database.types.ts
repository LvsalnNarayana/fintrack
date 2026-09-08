export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string;
          display_name: string | null;
          base_currency: string;
          date_format: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          display_name?: string | null;
          base_currency?: string;
          date_format?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          display_name?: string | null;
          base_currency?: string;
          date_format?: string;
          updated_at?: string;
        };
      };
      banks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          bank_id: string;
          name: string;
          account_type: 'SAVINGS' | 'CURRENT' | 'SALARY' | 'CREDIT_CARD' | 'CASH' | 'OTHER';
          account_number_mask: string | null;
          currency: string;
          opening_balance: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank_id: string;
          name: string;
          account_type?: 'SAVINGS' | 'CURRENT' | 'SALARY' | 'CREDIT_CARD' | 'CASH' | 'OTHER';
          account_number_mask?: string | null;
          currency?: string;
          opening_balance?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bank_id?: string;
          name?: string;
          account_type?: 'SAVINGS' | 'CURRENT' | 'SALARY' | 'CREDIT_CARD' | 'CASH' | 'OTHER';
          account_number_mask?: string | null;
          currency?: string;
          opening_balance?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          parent_id: string | null;
          name: string;
          type: 'INCOME' | 'EXPENSE';
          color: string;
          icon: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          parent_id?: string | null;
          name: string;
          type: 'INCOME' | 'EXPENSE';
          color?: string;
          icon?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          parent_id?: string | null;
          name?: string;
          type?: 'INCOME' | 'EXPENSE';
          color?: string;
          icon?: string | null;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      import_batches: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          source_file_name: string;
          source_file_hash: string;
          total_rows: number;
          imported_rows: number;
          skipped_duplicates: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          source_file_name: string;
          source_file_hash: string;
          total_rows?: number;
          imported_rows?: number;
          skipped_duplicates?: number;
          created_at?: string;
        };
        Update: {
          total_rows?: number;
          imported_rows?: number;
          skipped_duplicates?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          import_batch_id: string | null;
          import_row_number: number | null;
          import_sequence: number;
          order_date: string;
          date: string;
          description: string;
          amount: number;
          transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
          deposit: number;
          withdrawal: number;
          running_balance: number | null;
          currency: string;
          notes: string | null;
          transfer_pair_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          import_batch_id?: string | null;
          import_row_number?: number | null;
          import_sequence?: number;
          order_date?: string;
          date: string;
          description: string;
          amount: number;
          transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
          deposit?: number;
          withdrawal?: number;
          running_balance?: number | null;
          currency?: string;
          notes?: string | null;
          transfer_pair_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          category_id?: string | null;
          date?: string;
          description?: string;
          amount?: number;
          transaction_type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
          deposit?: number;
          withdrawal?: number;
          running_balance?: number | null;
          currency?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      categorization_rules: {
        Row: {
          id: string;
          user_id: string;
          keyword: string;
          match_type: 'CONTAINS' | 'EXACT' | 'STARTS_WITH' | 'REGEX';
          category_id: string;
          priority: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          keyword: string;
          match_type?: 'CONTAINS' | 'EXACT' | 'STARTS_WITH' | 'REGEX';
          category_id: string;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          keyword?: string;
          match_type?: 'CONTAINS' | 'EXACT' | 'STARTS_WITH' | 'REGEX';
          category_id?: string;
          priority?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_dashboard_summary: {
        Args: {
          p_start_date: string;
          p_end_date: string;
          p_account_id?: string | null;
        };
        Returns: {
          income: number;
          expense: number;
          net_flow: number;
          current_balance: number;
        };
      };
      get_category_spending: {
        Args: {
          p_start_date: string;
          p_end_date: string;
          p_account_id?: string | null;
        };
        Returns: {
          category_id: string;
          category_name: string;
          category_color: string;
          total_amount: number;
          transaction_count: number;
        }[];
      };
      get_monthly_cash_flow: {
        Args: {
          p_year: number;
          p_account_id?: string | null;
        };
        Returns: {
          month_num: number;
          month_name: string;
          total_income: number;
          total_expense: number;
          net_savings: number;
        }[];
      };
      get_top_merchants: {
        Args: {
          p_start_date: string;
          p_end_date: string;
          p_limit?: number;
        };
        Returns: {
          merchant_name: string;
          total_spent: number;
          transaction_count: number;
        }[];
      };
    };
  };
}

