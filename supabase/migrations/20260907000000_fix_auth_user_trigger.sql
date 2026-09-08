-- Fix signup triggers for hosted Supabase.
-- Apply this after 20260906000000_init.sql.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

UPDATE public.profiles
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL;

ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_username ON public.profiles (username);

CREATE OR REPLACE FUNCTION public.seed_default_user_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.categories (user_id, name, type, color, icon) VALUES
        (NEW.id, 'Salary', 'INCOME', '#16A34A', 'payments'),
        (NEW.id, 'Freelance', 'INCOME', '#10B981', 'work'),
        (NEW.id, 'Investments & Dividends', 'INCOME', '#059669', 'trending_up'),
        (NEW.id, 'Refunds', 'INCOME', '#34D399', 'receipt_long'),
        (NEW.id, 'Other Income', 'INCOME', '#6EE7B7', 'add_circle'),
        (NEW.id, 'Food & Dining', 'EXPENSE', '#EF4444', 'restaurant'),
        (NEW.id, 'Groceries', 'EXPENSE', '#F97316', 'local_grocery_store'),
        (NEW.id, 'Shopping', 'EXPENSE', '#F59E0B', 'shopping_bag'),
        (NEW.id, 'Transportation & Fuel', 'EXPENSE', '#3B82F6', 'directions_car'),
        (NEW.id, 'Bills & Utilities', 'EXPENSE', '#6366F1', 'receipt'),
        (NEW.id, 'Rent & Housing', 'EXPENSE', '#8B5CF6', 'home'),
        (NEW.id, 'Healthcare & Medical', 'EXPENSE', '#EC4899', 'medical_services'),
        (NEW.id, 'Entertainment & Leisure', 'EXPENSE', '#14B8A6', 'movie'),
        (NEW.id, 'Travel', 'EXPENSE', '#06B6D4', 'flight'),
        (NEW.id, 'Education', 'EXPENSE', '#84CC16', 'school'),
        (NEW.id, 'Subscriptions', 'EXPENSE', '#A855F7', 'subscriptions'),
        (NEW.id, 'Investments Outflow', 'EXPENSE', '#64748B', 'savings'),
        (NEW.id, 'Other Expense', 'EXPENSE', '#94A3B8', 'more_horiz')
    ON CONFLICT (user_id, name, type) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        lower(COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(COALESCE(NEW.email, ''), '@', 1))),
        split_part(COALESCE(NEW.email, ''), '@', 1)
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

DROP TRIGGER IF EXISTS trg_user_seed_categories ON public.profiles;
CREATE TRIGGER trg_user_seed_categories
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.seed_default_user_categories();
