# Supabase setup

1. Open **Supabase Dashboard → SQL Editor → New query**.
2. Copy all content from `supabase/schema.sql`, paste it, then click **Run**.
3. Open **Authentication → Users → Add user** and create the first administrator with email and password.
4. Return to SQL Editor and run the final commented `insert into public.profiles...` statement in `schema.sql`, replacing `YOUR_ADMIN_EMAIL`.
5. In **Project Settings → API**, copy the Project URL and the client-side anon/publishable key.
6. In Vercel open **Project → Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Apply both variables to Production, Preview and Development, then redeploy.

Do not put a Supabase `service_role` or secret key in Vercel variables beginning with `VITE_`; Vite exposes those variables to browser code.

## Adding staff
Create each login in **Authentication → Users** first. Then add the matching profile from SQL Editor:

```sql
insert into public.profiles (id,name,email,role)
select id,'STAFF NAME',email,'sales'::public.user_role
from auth.users where email = 'staff@example.com'
on conflict (id) do update set name=excluded.name,email=excluded.email,role=excluded.role;
```

Use `admin` instead of `sales` only for staff who may edit central pricing.
