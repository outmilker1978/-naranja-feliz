import Link from "next/link";
import ContentEditor from "@/components/content-editor";

export default async function NewContentPage(props: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await props.searchParams;
  const initial = type ? { type, status: "draft" } : undefined;

  return (
    <>
      <div className="border-b border-border/30 bg-white fixed top-[73px] left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-8 py-2.5">
          <Link href="/admin/content" className="text-sm font-semibold text-primary-500 hover:text-primary-600">
            ← Назад
          </Link>
          <h1 className="text-sm font-medium text-accent truncate">Новый материал</h1>
        </div>
      </div>
      <div className="pt-14">
        <div className="glass-card p-6">
          <ContentEditor initial={initial} />
        </div>
      </div>
    </>
  );
}
