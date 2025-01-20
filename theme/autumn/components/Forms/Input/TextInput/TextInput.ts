import { User } from "../../../../factories/User";
import { Pluncx } from "../../../../interfaces/pluncx";


export namespace TextInput {
    export const render = async () => {
        const scope = Pluncx.scope<{lastName: string}>()
        const UserModel = new User('Ryan')
        scope.lastName = UserModel.lastName
        await Pluncx.patch()
    }
}

export const render = () => {}

export const getTextInput = () => {
    return 'hello world!';
}