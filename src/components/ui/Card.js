"use client";

import React from "react";

const Card = ({
  children,
  className = "",
  padding = "large",
  shadow = true,
  ...props
}) => {
  const baseClasses = "bg-white rounded-lg border border-duo-border";

  // Responsive padding that feels right on mobile and scales up
  const paddingClasses = {
    none: "",
    small: "p-3 sm:p-4",
    medium: "p-4 sm:p-5 md:p-6",
    large: "p-4 sm:p-6 md:p-8",
  };

  const shadowClass = shadow
    ? "shadow-lg hover:shadow-xl transition-shadow duration-200"
    : "";

  const classes = `
    ${baseClasses}
    ${paddingClasses[padding]}
    ${shadowClass}
    ${className}
  `.trim();

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "", ...props }) => (
  <h3
    className={`text-xl font-semibold text-duo-text-primary ${className}`}
    {...props}
  >
    {children}
  </h3>
);

const CardContent = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = "", ...props }) => (
  <div className={`mt-4 ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
