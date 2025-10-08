// import {getFileHandle} from "../util/opfs";
// import {requireAccount} from '../util/account-require';
// import { AccountSelectScreen } from "./screen-account-select";

// import {Icon} from "../component/icon";
// import {MenuScreen} from "./menu";

// import MenuIcon from 'lucide/dist/esm/icons/menu.js';
// import {MenuScreen} from "./screen-menu";

type _Vnode = Vnode<{}, typeof HomeScreen>;

// type Contact = {
//   accountId: string;
//   displayName: string;
// };

export const HomeScreen = {
  routePath: '/',
  // contacts: [] as Contact[],

  async oninit(vnode: _Vnode) {
    // if (!await requireAccount(true)) return;

    // // Fetch contacts/follows
    // const contactsHandle = await getFileHandle(`/local/accounts/${localStorage.selectedAccount}/contacts.json`, { create: true })
    // vnode.state.contacts = [];
    // try {
    //   vnode.state.contacts = JSON.parse(Buffer.from(await (await contactsHandle.getFile()).bytes()));
    // } catch {
    //   vnode.state.contacts = [];
    // }

    //       // const accountConfigHandle = await getFileHandle(`/local/accounts/${accountId}/config.json`)
    //       // const accountConfig       = JSON.parse(Buffer.from(await (await accountConfigHandle.getFile()).bytes()));

    // // const deviceKeyWritable = await deviceKeyHandle.createWritable();
    // // await deviceKeyWritable.write(JSON.stringify(deviceKey.toJSON(), null, 2));
    // // await deviceKeyWritable.close();
  },

  view(vnode: _Vnode) {
    return (
      <div class="main">
        Hello World
      </div>
    );
  },
};
