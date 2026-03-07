import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCategoryDialog } from '@/components/dialogs/CreateCategoryDialog';

describe('CreateCategoryDialog', () => {
   it('does not render when closed', () => {
      render(<CreateCategoryDialog isOpen={false} onClose={() => { }} onCreate={() => { }} />);
      expect(screen.queryByText('New Category')).not.toBeInTheDocument();
   });

   it('renders dialog when open', () => {
      render(<CreateCategoryDialog isOpen={true} onClose={() => { }} onCreate={() => { }} />);
      expect(screen.getByText('New Category')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Category name...')).toBeInTheDocument();
   });

   it('calls onCreate with name and color', async () => {
      const user = userEvent.setup();
      let createdName = '';
      let createdColor = '';
      render(
         <CreateCategoryDialog
            isOpen={true}
            onClose={() => { }}
            onCreate={(name, color) => { createdName = name; createdColor = color; }}
         />
      );
      await user.type(screen.getByPlaceholderText('Category name...'), 'JavaScript');
      await user.click(screen.getByText('Create'));
      expect(createdName).toBe('JavaScript');
      expect(createdColor).toBe('#e11d48'); // default first color
   });

   it('disables Create button when name is empty', () => {
      render(<CreateCategoryDialog isOpen={true} onClose={() => { }} onCreate={() => { }} />);
      expect(screen.getByText('Create').closest('button')).toBeDisabled();
   });

   it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      let closed = false;
      render(<CreateCategoryDialog isOpen={true} onClose={() => { closed = true; }} onCreate={() => { }} />);
      await user.click(screen.getByText('Cancel'));
      expect(closed).toBe(true);
   });
});
