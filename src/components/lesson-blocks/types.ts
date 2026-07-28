export type BlockType =
  | "text"
  | "image"
  | "video"
  | "fill_blank"
  | "choice"
  | "open_question"
  | "audio_answer"
  | "video_answer"
  | "drag_order"
  | "image_pick"
  | "group_drag";

export interface TextContent {
  html: string;
}

export interface ImageContent {
  src: string;
  caption?: string;
  width?: string;
}

export interface VideoContent {
  src: string;
  type: "video" | "audio";
  caption?: string;
}

export interface FillBlankContent {
  text: string;
  maxAttempts?: 1 | 3;
}

export interface ChoiceContent {
  question: string;
  options: string[];
  correct: number[];
  multiple: boolean;
  maxAttempts?: 1 | 3;
}

export interface OpenQuestionContent {
  question: string;
}

export interface AudioAnswerContent {
  prompt: string;
}

export interface VideoAnswerContent {
  prompt: string;
}

export interface DragOrderContent {
  sentenceTemplate: string;
  maxAttempts?: 1 | 3;
}

export interface ImagePickContent {
  question: string;
  images: { src: string; label: string }[];
  correct: number[];
  multiple: boolean;
  maxAttempts?: 1 | 3;
}

export interface GroupDragContent {
  instruction: string;
  groups: { label: string; words: string[] }[];
  layout: "columns" | "table";
  maxAttempts?: 1 | 3;
}

export type BlockContent =
  | TextContent
  | ImageContent
  | VideoContent
  | FillBlankContent
  | ChoiceContent
  | OpenQuestionContent
  | AudioAnswerContent
  | VideoAnswerContent
  | DragOrderContent
  | ImagePickContent
  | GroupDragContent;

export interface LessonBlock {
  id: string;
  lesson_id: string;
  type: BlockType;
  content: BlockContent;
  order_index: number;
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  text: "Текст",
  image: "Изображение",
  video: "Видео / Аудио",
  fill_blank: "Вставка слова",
  choice: "Выбор ответа",
  open_question: "Открытый вопрос",
  audio_answer: "Запись голоса",
  video_answer: "Запись видео",
  drag_order: "Порядок",
  image_pick: "Выбор изображения",
  group_drag: "Групповой порядок",
};

export const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  text: "Форматированный текст с возможностью перевода и озвучки фрагментов",
  image: "Изображение с подписью, настраиваемой шириной",
  video: "Видео или аудиофайл для вставки в урок",
  fill_blank: "Текст с пропусками — ученик вставляет пропущенные слова",
  choice: "Вопрос с вариантами ответа (один или несколько правильных)",
  open_question: "Вопрос с открытым ответом — ученик пишет текстом",
  audio_answer: "Задание записать голосовой ответ на вопрос",
  video_answer: "Задание записать видеоответ",
  drag_order: "Слова перемешиваются — ученик собирает правильный порядок",
  image_pick: "Выбор правильного изображения из нескольких",
  group_drag: "Группы слов — ученик перетаскивает слова в ячейки своей группы (таблица или колонки)",
};
