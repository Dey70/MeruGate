import { createClient } from "@/lib/supabase/server";
import { getAllUserNotes } from "@/lib/queries/notes";
import { NotesList } from "@/components/notes/notes-list";

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const notes = await getAllUserNotes(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <p className="mt-1 text-muted-foreground">All your topic notes in one place.</p>
      </div>
      <NotesList notes={notes} />
    </div>
  );
}
