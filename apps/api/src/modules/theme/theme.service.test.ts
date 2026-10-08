import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ThemeService } from './theme.service';

test('ThemeService calculates accurate WCAG 2.1 contrast ratios', () => {
  const service = new ThemeService({} as any, {} as any);

  // Black on White: 21:1
  const blackOnWhite = service.calculateContrastRatio('#000000', '#ffffff');
  assert.equal(blackOnWhite, 21);

  // Prototype dark background #03050F and foreground #E8EFF8
  const ratio = service.calculateContrastRatio('#03050F', '#E8EFF8');
  assert.ok(ratio >= 15, `Dark theme base contrast ratio is ${ratio}, should be >= 15`);

  // Audit evaluation
  const audit = service.auditTokens({
    bg: '#03050F',
    fg: '#E8EFF8',
    card: '#0A1130',
    muted: '#7F95C4',
    lime: '#2F5BFF',
    limeInk: '#FFFFFF',
  });

  assert.equal(audit.score, 'AA');
  assert.equal(audit.results.length, 5);
  assert.equal(audit.results[0]!.wcagAA, true);
});
