import db from "../models";

const { Avatar } =db;

export async function getAllAvatars(): Promise<{ avatar_id: number, name: string, path: string }[]> {
    try {
        const avatars = await Avatar.findAll();
        return avatars.map((avatar:any) => avatar.toJSON()) as { avatar_id: number, name: string, path: string }[];
    }
    catch (err) {
        throw err;
    }
}

export async function getAvatar(avatar_id: number): Promise<{ avatar_id: number, name: string, path: string } | null> {
    try {
        const avatar = await Avatar.findByPk(avatar_id);
        return avatar ? avatar.toJSON() as { avatar_id: number, name: string, path: string } : null;
    }
    catch (err) {
        throw err;
    }
}