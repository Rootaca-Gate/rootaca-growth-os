import { overallReviewScore, scoreGrowth, dimensionGrowth } from './progress-growth';

describe('progress growth', () => {
  const initial = {
    technicalSkills: 40,
    problemSolving: 30,
    projects: 20,
    independence: 35,
    communication: 50,
  };
  const monthly = {
    technicalSkills: 55,
    problemSolving: 45,
    projects: 40,
    independence: 50,
    communication: 60,
  };

  it('averages the five tracked dimensions', () => {
    expect(overallReviewScore(initial)).toBe(35);
    expect(overallReviewScore(monthly)).toBe(50);
  });

  it('returns null growth for the first review', () => {
    expect(scoreGrowth(35, null)).toEqual({
      currentScore: 35,
      previousScore: null,
      growth: null,
    });
  });

  it('computes current, previous, and growth versus the last review', () => {
    expect(scoreGrowth(50, 35)).toEqual({
      currentScore: 50,
      previousScore: 35,
      growth: 15,
    });
    const dimensions = dimensionGrowth(monthly, initial);
    expect(dimensions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'technicalSkills',
          label: 'Technical Skills',
          currentScore: 55,
          previousScore: 40,
          growth: 15,
        }),
        expect.objectContaining({
          key: 'projects',
          currentScore: 40,
          previousScore: 20,
          growth: 20,
        }),
      ]),
    );
  });
});
