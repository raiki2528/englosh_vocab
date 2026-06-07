import type { VocabularyItem } from "@/lib/vocabulary";

export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function ExampleBlock({
  label,
  en,
  ja,
}: {
  label: string;
  en: string;
  ja: string;
}) {
  if (!en && !ja) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-400">{label}</p>
      {en ? (
        <p className="text-[15px] leading-7 text-gray-800">
          <RichText text={en} />
        </p>
      ) : null}
      {ja ? (
        <p className="mt-2 text-sm leading-7 text-gray-500">
          <RichText text={ja} />
        </p>
      ) : null}
    </div>
  );
}

type VocabDetailProps = {
  item: VocabularyItem;
  memoLabel?: string;
  className?: string;
};

export function VocabDetail({
  item,
  memoLabel = "説明",
  className = "",
}: VocabDetailProps) {
  return (
    <div className={className}>
      {item.meaning ? (
        <p className="text-center text-lg leading-relaxed text-gray-900">
          {item.meaning}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        <ExampleBlock
          label="例文 1"
          en={item.example1}
          ja={item.example1Ja}
        />
        <ExampleBlock
          label="例文 2"
          en={item.example2}
          ja={item.example2Ja}
        />
      </div>

      {item.memo ? (
        <div className="mt-6 rounded-2xl bg-gray-100 px-5 py-4 text-sm leading-7 text-gray-700">
          <p className="mb-2 text-xs font-medium text-gray-400">{memoLabel}</p>
          {item.memo}
        </div>
      ) : null}
    </div>
  );
}
