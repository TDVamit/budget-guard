import { splitStyle } from '../Surface';

describe('splitStyle', () => {
  it('sends sizing to the touchable and painting to the child', () => {
    const { layout, paint } = splitStyle({
      flexBasis: '47%',
      flexGrow: 1,
      minHeight: 86,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#000',
    });

    expect(layout).toEqual({ flexBasis: '47%', flexGrow: 1, minHeight: 86 });
    expect(paint).toEqual({
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#000',
    });
  });

  it('keeps a button full width and full height on the touchable', () => {
    // The regression: padding and alignment on the Pressable made it wrap its
    // text, so only the label was tappable.
    const { layout, paint } = splitStyle([
      { minHeight: 52, alignSelf: 'stretch', alignItems: 'center', paddingHorizontal: 16 },
      { flex: 1 },
    ]);

    expect(layout).toEqual({ minHeight: 52, alignSelf: 'stretch', flex: 1 });
    expect(paint.paddingHorizontal).toBe(16);
    expect(paint.alignItems).toBe('center');
    expect('flex' in paint).toBe(false);
  });

  it('handles absolute placement, as the floating action button uses', () => {
    const { layout, paint } = splitStyle({ position: 'absolute', right: 16, bottom: 16, borderRadius: 30 });
    expect(layout).toEqual({ position: 'absolute', right: 16, bottom: 16 });
    expect(paint).toEqual({ borderRadius: 30 });
  });

  it('survives an empty or undefined style', () => {
    expect(splitStyle(undefined)).toEqual({ layout: {}, paint: {} });
  });
});
