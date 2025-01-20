import { User } from "../../factories/Application/User";
import { Pluncx } from "../../interfaces/pluncx";
import { EntityAssertToolkit } from "../../services/kryptolib/kernel/EntityAssertToolkit";
import { CardHeader } from "../CardHeader/CardHeader";
import { TextInput, getTextInput } from "../Forms/Input/TextInput/TextInput";

type ProfileCardScope = {
    state: string
    firstName: string,
    lastName: string
}
const scope = Pluncx.scope<ProfileCardScope>()
Pluncx.app().ready(async ()=>{
    scope.firstName = 'Vince Ivan'
    const AppUser = new User()
    scope.lastName = AppUser.lastName
    scope.state = 'active'
    EntityAssertToolkit.isEntityId('PgsnQzIK7BQztV10ZRtZCwklErAzhJP7')
    await Pluncx.patch()
    TextInput.render()
    CardHeader.render()
})
export namespace ProfileCard {
    export const render = () => {}
}

function canla(){}