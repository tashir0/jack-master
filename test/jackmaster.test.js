const sut = require('../src/jack-master.js');


describe('meeting', () => {
  it.each([
    [],
    [ 'Taro' ],
    [ 'Taro', 'Jiro' ]
  ])('should return error message when members less than 3', (...members) => {
    const result = sut.whosFacilitator(members);
    expect(result).toBe('At least 3 members are required to start a meeting');
  });

  it('should assign members to each role randomly', () => {
    const result = sut.whosFacilitator([ 'Taro', 'Jiro', 'Hanako' ]);
    expect(result).toMatch(/ファシリテーター: (Taro|Jiro|Hanako)\nタイム・キーパー: (Taro|Jiro|Hanako)\n書記: (Taro|Jiro|Hanako)/);
  });
});
