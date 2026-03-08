import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorContextMenu } from '@/components/editor/EditorContextMenu';

describe('EditorToolbar', () => {
   const defaultProps = {
      isDirty: false,
      isPinned: false,
      isArchived: false,
      onTogglePin: vi.fn(),
      onToggleArchive: vi.fn(),
      onSave: vi.fn(),
      onDelete: vi.fn(),
   };

   it('renders toolbar buttons', () => {
      render(<EditorToolbar {...defaultProps} />);
      expect(screen.getByTitle('Pin')).toBeInTheDocument();
      expect(screen.getByTitle('Archive')).toBeInTheDocument();
      expect(screen.getByTitle('Save (Ctrl+S)')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
   });

   it('shows "Unsaved" when dirty', () => {
      render(<EditorToolbar {...defaultProps} isDirty={true} />);
      expect(screen.getByText('Unsaved')).toBeInTheDocument();
   });

   it('does not show "Unsaved" when clean', () => {
      render(<EditorToolbar {...defaultProps} />);
      expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
   });

   it('shows Unpin title when pinned', () => {
      render(<EditorToolbar {...defaultProps} isPinned={true} />);
      expect(screen.getByTitle('Unpin')).toBeInTheDocument();
   });

   it('shows Unarchive title when archived', () => {
      render(<EditorToolbar {...defaultProps} isArchived={true} />);
      expect(screen.getByTitle('Unarchive')).toBeInTheDocument();
   });

   it('calls onTogglePin when pin button clicked', async () => {
      const user = userEvent.setup();
      const onTogglePin = vi.fn();
      render(<EditorToolbar {...defaultProps} onTogglePin={onTogglePin} />);
      await user.click(screen.getByTitle('Pin'));
      expect(onTogglePin).toHaveBeenCalledOnce();
   });

   it('calls onSave when save button clicked', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<EditorToolbar {...defaultProps} onSave={onSave} />);
      await user.click(screen.getByTitle('Save (Ctrl+S)'));
      expect(onSave).toHaveBeenCalledOnce();
   });

   it('calls onDelete when delete button clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<EditorToolbar {...defaultProps} onDelete={onDelete} />);
      await user.click(screen.getByTitle('Delete'));
      expect(onDelete).toHaveBeenCalledOnce();
   });
});

describe('EditorContextMenu', () => {
   const defaultProps = {
      x: 100,
      y: 200,
      onApplyInlineFormat: vi.fn(),
      onApplyLinePrefix: vi.fn(),
   };

   it('renders inline format buttons', () => {
      render(<EditorContextMenu {...defaultProps} />);
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('Italic')).toBeInTheDocument();
      expect(screen.getByText('Strikethrough')).toBeInTheDocument();
      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Highlight')).toBeInTheDocument();
   });

   it('renders block format buttons', () => {
      render(<EditorContextMenu {...defaultProps} />);
      expect(screen.getByText('Heading 1')).toBeInTheDocument();
      expect(screen.getByText('Heading 2')).toBeInTheDocument();
      expect(screen.getByText('Heading 3')).toBeInTheDocument();
      expect(screen.getByText('Bullet List')).toBeInTheDocument();
      expect(screen.getByText('Numbered List')).toBeInTheDocument();
      expect(screen.getByText('Blockquote')).toBeInTheDocument();
   });

   it('calls onApplyInlineFormat with correct wrapper for Bold', async () => {
      const user = userEvent.setup();
      const onApplyInlineFormat = vi.fn();
      render(<EditorContextMenu {...defaultProps} onApplyInlineFormat={onApplyInlineFormat} />);
      await user.click(screen.getByText('Bold'));
      expect(onApplyInlineFormat).toHaveBeenCalledWith('**');
   });

   it('calls onApplyInlineFormat with correct wrapper for Code', async () => {
      const user = userEvent.setup();
      const onApplyInlineFormat = vi.fn();
      render(<EditorContextMenu {...defaultProps} onApplyInlineFormat={onApplyInlineFormat} />);
      await user.click(screen.getByText('Code'));
      expect(onApplyInlineFormat).toHaveBeenCalledWith('`');
   });

   it('calls onApplyLinePrefix with correct prefix for Heading 1', async () => {
      const user = userEvent.setup();
      const onApplyLinePrefix = vi.fn();
      render(<EditorContextMenu {...defaultProps} onApplyLinePrefix={onApplyLinePrefix} />);
      await user.click(screen.getByText('Heading 1'));
      expect(onApplyLinePrefix).toHaveBeenCalledWith('# ');
   });

   it('calls onApplyLinePrefix with correct prefix for Bullet List', async () => {
      const user = userEvent.setup();
      const onApplyLinePrefix = vi.fn();
      render(<EditorContextMenu {...defaultProps} onApplyLinePrefix={onApplyLinePrefix} />);
      await user.click(screen.getByText('Bullet List'));
      expect(onApplyLinePrefix).toHaveBeenCalledWith('- ');
   });

   it('positions menu at given coordinates', () => {
      const { container } = render(<EditorContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.style.left).toBe('100px');
      expect(menu.style.top).toBe('200px');
   });
});
