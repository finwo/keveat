import {HomeScreen} from "../screen/home";


type _Vnode = Vnode<{}, typeof NavPartial>;

// type Contact = {
//   accountId: string;
//   displayName: string;
// };

export const NavPartial = {
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
      <nav>
        <header>Keveat</header>
        <ul>
          <li><a href={`#!${HomeScreen.routePath}`}>Home</a></li>
        </ul>
      </nav>
    );
  },
};
