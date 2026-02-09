export const Size = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
} as const;
export type Size = (typeof Size)[keyof typeof Size];

export const Variant = {
  default: "default",
  primary: "primary",
  secondary: "secondary",
  destructive: "destructive",
  outline: "outline",
  ghost: "ghost",
  link: "link",
} as const;
export type Variant = (typeof Variant)[keyof typeof Variant];

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
