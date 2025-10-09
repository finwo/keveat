type _Vnode = Vnode<{}, typeof LoginScreen>;

export const LoginScreen = {
  routePath: '/login',

  view(vnode: _Vnode) {

    const styles = {
      main: {
        background: 'color-mix(in srgb, var(--col-fg), transparent 90%)',
        margin: '2rem auto',
        padding: '1rem',
        width: '20rem',
        // border: '1px solid var(--col-fg)',
      },
      label: {
        display: 'block',
      },
    };

    return (
      <form style={styles.main}>
        <h3>Login</h3>
        <div class="input-group">
          <label style={styles.label} for="token">Token</label>
          <input style={styles.input} type="text"/>
        </div>
        <div style="margin:0 -1rem -1rem -1rem;">
          <button>Login</button>
        </div>
      </form>
    );
  },
};
