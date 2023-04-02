import {Link, Outlet} from '@remix-run/react';

export default function () {
  return (
    <>
      <div>
        <h1>Proxy API</h1>
        <ul>
          <li>
            <Link to="Mode" >
              Mode
            </Link>
          </li>
          <li>
            <Link to="Endpoints">
              Endpoints
            </Link>
          </li>
          <li>
            <Link to="RequestLogs">
              Request Logs
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <Outlet />
      </div>
    </>
  );
}
