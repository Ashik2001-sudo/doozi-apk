import React from 'react';

const css = `
  html, body, #root {
    overflow-x: hidden !important;
    max-width: 100vw !important;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  input,
  textarea,
  select,
  button,
  [role="button"] {
    -webkit-tap-highlight-color: transparent;
  }
`;

export function GlobalFocusStyles() {
  return React.createElement('style', {
    dangerouslySetInnerHTML: { __html: css },
  });
}
