import type { VocabularyItem } from "@/lib/vocabulary";
import {
  getEntryTypeLabel,
  getSynonymsLabel,
  shouldShowExample1,
  shouldShowExample2,
} from "@/lib/entry-type";

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

export function EntryTypeBadge({ item }: { item: Pick<VocabularyItem, "entryType"> }) {
  if (item.entryType === "word") return null;

  return (
    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
      {getEntryTypeLabel(item.entryType)}
    </span>
  );
}

function parseSynonyms(synonyms: string): string[] {
  return synonyms
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function SynonymsBlock({
  synonyms,
  label,
}: {
  synonyms: string;
  label: string;
}) {
  const items = parseSynonyms(synonyms);
  if (items.length === 0) return null;

  return (
    <div className="mt-4 text-center">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {items.map((synonym) => (
          <span
            key={synonym}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
          >
            {synonym}
          </span>
        ))}
      </div>
    </div>
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
  const showExample1 = shouldShowExample1(item);
  const showExample2 = shouldShowExample2(item);

  return (
    <div className={className}>
      {item.entryType !== "word" ? (
        <div className="mb-4 flex justify-center">
          <EntryTypeBadge item={item} />
        </div>
      ) : null}

      {item.meaning ? (
        <p
          className={`text-center leading-relaxed text-gray-900 ${
            item.entryType === "sentence" ? "text-base" : "text-lg"
          }`}
        >
          {item.meaning}
        </p>
      ) : null}

      {item.synonyms ? (
        <SynonymsBlock
          synonyms={item.synonyms}
          label={getSynonymsLabel(item.entryType)}
        />
      ) : null}

      {showExample1 || showExample2 ? (
        <div className="mt-8 space-y-6">
          {showExample1 ? (
            <ExampleBlock
              label={item.entryType === "sentence" ? "使い方の例" : "例文 1"}
              en={item.example1}
              ja={item.example1Ja}
            />
          ) : null}
          {showExample2 ? (
            <ExampleBlock
              label="例文 2"
              en={item.example2}
              ja={item.example2Ja}
            />
          ) : null}
        </div>
      ) : null}

      {item.memo ? (
        <div className="mt-6 rounded-2xl bg-gray-100 px-5 py-4 text-sm leading-7 text-gray-700">
          <p className="mb-2 text-xs font-medium text-gray-400">{memoLabel}</p>
          {item.memo}
        </div>
      ) : null}
    </div>
  );
}
