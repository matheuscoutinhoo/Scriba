export interface User {
   id: string;
   username: string;
   email: string;
   password_hash: string;
   display_name: string | null;
   created_at: string;
   updated_at: string;
}

export interface Category {
   id: string;
   name: string;
   slug: string;
   color: string;
   icon: string | null;
   user_id: string;
   parent_id: string | null;
   position: number;
   created_at: string;
   updated_at: string;
}

export interface Note {
   id: string;
   title: string;
   content: string;
   excerpt: string | null;
   is_pinned: number;
   is_archived: number;
   user_id: string;
   category_id: string | null;
   position: number;
   created_at: string;
   updated_at: string;
}

export interface Tag {
   id: string;
   name: string;
   slug: string;
   user_id: string;
   created_at: string;
}

export interface NoteTag {
   note_id: string;
   tag_id: string;
}

// API DTOs

export interface CreateNoteDTO {
   title: string;
   content?: string;
   category_id?: string;
   tags?: string[];
}

export interface UpdateNoteDTO {
   title?: string;
   content?: string;
   category_id?: string | null;
   is_pinned?: boolean;
   is_archived?: boolean;
   tags?: string[];
}

export interface CreateCategoryDTO {
   name: string;
   color?: string;
   icon?: string;
   parent_id?: string;
}

export interface UpdateCategoryDTO {
   name?: string;
   color?: string;
   icon?: string;
   parent_id?: string | null;
   position?: number;
}

export interface NoteWithTags extends Note {
   tags: Tag[];
   category?: Category;
}

export interface CategoryWithCount extends Category {
   note_count: number;
   children?: CategoryWithCount[];
}

export interface SearchResult {
   notes: NoteWithTags[];
   total: number;
}
