import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/layout/Sidebar';

// Mock CategoryTree since it uses hooks (useCategories)
vi.mock('@/components/sidebar/CategoryTree', () => ({
   CategoryTree: () => <div data-testid="category-tree" />,
}));

describe('Sidebar', () => {
   const defaultProps = {
      selectedCategoryId: null as string | null,
      searchQuery: '',
      onSelectCategory: vi.fn(),
      onSearch: vi.fn(),
      onNewNote: vi.fn(),
      onNewCategory: vi.fn(),
   };

   it('renders logo and tagline', () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByText('criba')).toBeInTheDocument();
      expect(screen.getByText('Smart Notes')).toBeInTheDocument();
   });

   it('renders search input with provided value', () => {
      render(<Sidebar {...defaultProps} searchQuery="hello" />);
      expect(screen.getByPlaceholderText('Search notes...')).toHaveValue('hello');
   });

   it('calls onSearch when typing in search', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} onSearch={onSearch} />);

      await user.type(screen.getByPlaceholderText('Search notes...'), 'test');
      expect(onSearch).toHaveBeenCalled();
   });

   it('calls onNewNote when New Note button is clicked', async () => {
      const onNewNote = vi.fn();
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} onNewNote={onNewNote} />);

      await user.click(screen.getByText('New Note'));
      expect(onNewNote).toHaveBeenCalledTimes(1);
   });

   it('calls onSelectCategory with null for All Notes', async () => {
      const onSelectCategory = vi.fn();
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} onSelectCategory={onSelectCategory} />);

      await user.click(screen.getByText('All Notes'));
      expect(onSelectCategory).toHaveBeenCalledWith(null);
   });

   it('highlights All Notes when no category selected', () => {
      render(<Sidebar {...defaultProps} selectedCategoryId={null} />);
      const allNotes = screen.getByText('All Notes');
      expect(allNotes.className).toContain('text-[var(--color-accent)]');
   });

   it('renders CategoryTree', () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByTestId('category-tree')).toBeInTheDocument();
   });
});
