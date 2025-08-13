import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RegionPill, REGION_COLORS } from '@/App';
import { describe, it, expect } from 'vitest';

describe('RegionPill', () => {
  it('renders the region name with appropriate color', () => {
    const name = 'South';
    const html = renderToStaticMarkup(<RegionPill name={name} />);
    expect(html).toContain(`Region ${name}`);
    expect(html).toContain(name);
    expect(html).toContain(`color:${REGION_COLORS[name]}`);
    expect(html).toContain(`border-color:${REGION_COLORS[name]}`);
  });
});
