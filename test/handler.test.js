const sut = require('../src/handler.js');

jest.mock('../src/environment.js', () => ({
  TEAM_MEMBERS: ['太郎', '花子', '次郎']
}));

const jackMaster = require('../src/jack-master.js');
jest.mock('../src/jack-master.js', () => ({
  whosFirst: jest.fn()
}));

describe('message', () => {
  const defaultMessage = ({
    channel: {
      send: jest.fn(),
    },
    reply: jest.fn(),
    content: '@jack-master'
  });

  it('should call reply when message is empty', () => {
    // arrange
    const mockReply = jest.fn();
    const message = {...defaultMessage, content: '', reply: mockReply};

    // act
    sut.message(message);

    // assert
    expect(mockReply).toHaveBeenCalledTimes(1);
  })

  it('should use the members set in environment when message without arguments', () => {
    // arrange
    const message = {...defaultMessage, content: '@jack-master order'}
    jackMaster.whosFirst.mockReturnValue('花子');

    // act
    sut.message(message);

    // assert
    expect(jackMaster.whosFirst).toHaveBeenCalledTimes(1);
    expect(jackMaster.whosFirst).toHaveBeenCalledWith(['太郎', '花子', '次郎']);
  })

  it('should use specified members when message with arguments', () => {
    // arrange
    const message = {...defaultMessage, content: '@jack-master order taro hanako jiro'}
    jackMaster.whosFirst.mockReturnValue('hanako');

    // act
    sut.message(message);

    // assert
    expect(jackMaster.whosFirst).toHaveBeenCalledTimes(1);
    expect(jackMaster.whosFirst).toHaveBeenCalledWith(['taro', 'hanako', 'jiro']);
  })
})
