-- Remove mock seed profiles and their associated data
-- (lessons, progress, traits, sessions cascade via FK references)

delete from traits       where kid_id in ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
delete from kid_progress where kid_id in ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
delete from lessons      where assigned_to in ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
delete from profiles     where id in ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003');
