import Link from "next/link";
import ContentEditor from "@/components/content-editor";

export default function NewContentPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/content" className="text-muted hover:text-accent">← Назад</Link>
        <h1 className="text-2xl font-bold text-accent">Новый материал</h1>
      </div>
      <div className="glass-card p-6">
        <ContentEditor />
      </div>
    </div>
  );
}
