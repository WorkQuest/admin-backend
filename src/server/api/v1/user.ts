import { User, } from '../../models/User';
import { UserAvatar, } from '../../models/UserAvatar';
import { error, output, saveImage, } from '../../utils';

export async function getUser(r) {
  return output({ firstName: 'John', });
}

export const getAvatar = async (r) => {
  try {
    const user: User = await User.findByPk(r.auth.credentials.id, {
      include: {
        model: UserAvatar,
        as: 'avatar',
      },
    });
    const avatarAsBase64 = `data:image/png;base64${user.avatar.image.toString('base64')}`;
    return output({ data: avatarAsBase64, userId: user.id, });
  }
  catch (err) {
    console.log(err);
    throw err;
  }
};

export const addAvatar = async (r) => {
  try {
    const user: User = r.auth.credentials;

    // this is basic example code, you may do with received file whatever you want
    const { avatarImage, } = r.payload;
    const previousAvatar = await UserAvatar.findOne({ where: { userId: user.id, }, });
    if (previousAvatar) {
      await previousAvatar.destroy();
    }

    await saveImage(user.id, avatarImage);

    return output({ message: 'Your avatar has been added!', });
  }
  catch (err) {
    if (err.message == 'This file type is now allowed') {
      return error(400000, 'This file type is now allowed', null);
    }

    console.log(err);
    throw err;
  }
};
