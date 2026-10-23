# Déploiement des règles de sécurité Supabase

1. Dans Supabase, ouvrez **SQL Editor** et exécutez `20261023_security_hardening.sql` une seule fois.
2. Ajoutez l'utilisateur administrateur autorisé (remplacez l'UUID par son `auth.users.id`) :

```sql
insert into public.admin_profiles (user_id)
values ('UUID_DE_L_ADMIN')
on conflict (user_id) do nothing;
```

3. Vérifiez avec un navigateur non connecté : les formulaires doivent encore pouvoir être envoyés, tandis que `orders`, `messages`, les comptes clients et les écritures de médias ne doivent plus être lisibles ou modifiables.

Cette migration garde la lecture publique du contenu du site et des médias nécessaires à l'affichage. Les envois de formulaires publics restent possibles : ajoutez un CAPTCHA ou une limitation de débit côté serveur si le spam devient un problème.
