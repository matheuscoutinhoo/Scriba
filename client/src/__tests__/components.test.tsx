import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick handler', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    const btn = container.querySelector('button')!;
    expect(btn.className).toContain('bg-');
  });
});

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'Hello');
    expect(input).toHaveValue('Hello');
  });
});

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea placeholder="Write something" />);
    expect(screen.getByPlaceholderText('Write something')).toBeInTheDocument();
  });

  it('accepts multiline input', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="Content" />);
    const textarea = screen.getByPlaceholderText('Content');
    await user.type(textarea, 'Line 1{enter}Line 2');
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });
});

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>React</Badge>);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('applies custom color', () => {
    const { container } = render(<Badge color="#22c55e">Tag</Badge>);
    const span = container.querySelector('span')!;
    expect(span.style.color).toBe('rgb(34, 197, 94)');
  });

  it('calls onClick when clickable', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Badge onClick={() => { clicked = true; }}>Click</Badge>);
    await user.click(screen.getByText('Click'));
    expect(clicked).toBe(true);
  });
});
