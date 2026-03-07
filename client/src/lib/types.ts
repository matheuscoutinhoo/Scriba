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
   tags: Tag[];
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
   note_count: number;
   children?: Category[];
}

export interface Tag {
   id: string;
   name: string;
   slug: string;
   user_id: string;
   created_at: string;
}

export interface CreateNotePayload {
   title: string;
   content?: string;
   category_id?: string;
   tags?: string[];
}

export interface UpdateNotePayload {
   title?: string;
   content?: string;
   category_id?: string | null;
   is_pinned?: boolean;
   is_archived?: boolean;
   tags?: string[];
}

export interface CreateCategoryPayload {
   name: string;
   color?: string;
   icon?: string;
   parent_id?: string;
}

export interface UpdateCategoryPayload {
   name?: string;
   color?: string;
   icon?: string;
   parent_id?: string | null;
   position?: number;
}

export interface ApiResponse<T> {
   data: T;
   total?: number;
}
