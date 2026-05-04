"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type ComboboxContextValue = {
  id?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  open: boolean;
  query: string;
  selectedLabel: string;
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  onValueChange: (value: string) => void;
  registerOption: (value: string, label: string) => void;
  unregisterOption: (value: string) => void;
};

type ComboboxRootProps = {
  children: ReactNode;
  id?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onValueChange?: (value: string) => void;
};

type ComboboxInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'disabled'>;
type ComboboxListProps = HTMLAttributes<HTMLDivElement>;
type ComboboxOptionProps = HTMLAttributes<HTMLButtonElement> & {
  value: string;
  children: ReactNode;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'icon';
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border text-sm font-medium shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-white/10',
        variant === 'primary' && 'border-gray-900 bg-gray-900 text-white hover:bg-black dark:border-white dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200',
        variant === 'secondary' && 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800',
        variant === 'ghost' && 'border-transparent bg-transparent text-gray-600 shadow-none hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        variant === 'destructive' && 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60',
        size === 'sm' && 'h-9 px-3',
        size === 'md' && 'h-11 px-4',
        size === 'icon' && 'h-10 w-10 px-0',
        className
      )}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white dark:focus:ring-white/10',
        className
      )}
    />
  );
}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-24 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white dark:focus:ring-white/10',
        className
      )}
    />
  );
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useCombobox() {
  const context = useContext(ComboboxContext);
  if (!context) {
    throw new Error('Combobox components must be used inside <Combobox>.');
  }
  return context;
}

function Root({
  children,
  id,
  value,
  defaultValue = '',
  placeholder,
  disabled = false,
  className,
  onValueChange,
}: ComboboxRootProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Record<string, string>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedValue = value ?? internalValue;
  const selectedLabel = selectedValue ? options[selectedValue] || '' : '';

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const handleValueChange = useCallback((nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
    setOpen(false);
    setQuery('');
  }, [onValueChange, value]);

  const registerOption = useCallback((optionValue: string, label: string) => {
    setOptions(prev => ({ ...prev, [optionValue]: label }));
  }, []);

  const unregisterOption = useCallback((optionValue: string) => {
    setOptions(prev => {
      const next = { ...prev };
      delete next[optionValue];
      return next;
    });
  }, []);

  const contextValue = useMemo<ComboboxContextValue>(() => ({
    id,
    value: selectedValue,
    placeholder,
    disabled,
    open,
    query,
    selectedLabel,
    setOpen,
    setQuery,
    onValueChange: handleValueChange,
    registerOption,
    unregisterOption,
  }), [disabled, handleValueChange, id, open, placeholder, query, registerOption, selectedLabel, selectedValue, unregisterOption]);

  return (
    <ComboboxContext.Provider value={contextValue}>
      <div ref={rootRef} className={cn('relative w-full', className)}>
        {children}
      </div>
    </ComboboxContext.Provider>
  );
}

function ComboboxInput({ className, onFocus, onKeyDown, ...props }: ComboboxInputProps) {
  const {
    id,
    placeholder,
    disabled,
    open,
    query,
    selectedLabel,
    setOpen,
    setQuery,
  } = useCombobox();

  return (
    <div className="relative">
      <input
        {...props}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
        disabled={disabled}
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        onFocus={event => {
          setOpen(true);
          onFocus?.(event);
        }}
        onChange={event => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            setOpen(false);
            setQuery('');
          }
          onKeyDown?.(event);
        }}
        className={cn(
          'h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 pr-10 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white dark:focus:ring-white/10',
          className
        )}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300 dark:text-slate-400 dark:hover:text-white"
        aria-label={open ? 'Close options' : 'Open options'}
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
    </div>
  );
}

function List({ className, children, ...props }: ComboboxListProps) {
  const { id, open } = useCombobox();

  return (
    <div
      {...props}
      id={id ? `${id}-listbox` : undefined}
      role="listbox"
      className={cn(
        'absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900',
        !open && 'hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

function Option({ value, children, className, ...props }: ComboboxOptionProps) {
  const {
    value: selectedValue,
    query,
    onValueChange,
    registerOption,
    unregisterOption,
  } = useCombobox();
  const label = typeof children === 'string' ? children : String(value);
  const selected = selectedValue === value;
  const visible = !query || label.toLowerCase().includes(query.toLowerCase()) || value === '';

  useEffect(() => {
    registerOption(value, label);
    return () => unregisterOption(value);
  }, [label, registerOption, unregisterOption, value]);

  if (!visible) return null;

  return (
    <button
      {...props}
      type="button"
      role="option"
      aria-selected={selected}
      onMouseDown={event => {
        event.preventDefault();
        onValueChange(value);
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100 dark:text-slate-100 dark:hover:bg-slate-800',
        selected && 'bg-gray-100 font-medium dark:bg-slate-800',
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selected && <Check className="h-4 w-4 shrink-0" />}
    </button>
  );
}

export const Combobox = Object.assign(Root, {
  Input: ComboboxInput,
  List,
  Option,
});
