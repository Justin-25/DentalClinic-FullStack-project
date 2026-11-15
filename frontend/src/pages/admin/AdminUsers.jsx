import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { cardClass, rowClass, SearchField, tableBox, td, textLink, th, theadClass } from "./adminUi";
import { DeactivatedTag, RoleTag } from "./UserTags";
import { joinedOn } from "./users";
import { pill } from "./adminStyles";

const ROLE_FILTERS = [
  ["", "All"],
  ["patient", "Patients"],
  ["doctor", "Dentists"],
  ["admin", "Admins"],
];

// Everyone with an account, deactivated ones included (the admin can bring them back).
export default function AdminUsers() {
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");

  const usersQ = useQuery({ queryKey: ["users"], queryFn: () => api("/users") });

  const term = search.trim().toLowerCase();
  const list = [...(usersQ.data?.data.users ?? [])]
    .filter((u) => !role || u.role === role)
    .filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));

  const editLink = (u) => (
    <Link to={`/admin/users/${u._id}`} aria-label={`Edit ${u.name}`} className={textLink}>
      Edit ›
    </Link>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold text-ink lg:text-[32px]">Users</h1>
        <p className="hidden text-[13px] text-gray-500 lg:block">Patients, dentists and admins</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="hidden gap-2 lg:flex" role="group" aria-label="Role">
          {ROLE_FILTERS.map(([value, label]) => (
            <button key={label} type="button" aria-pressed={role === value} onClick={() => setRole(value)} className={pill(role === value)}>
              {label}
            </button>
          ))}
        </div>
        <SearchField label="Search" value={search} onChange={setSearch} placeholder="Name or email" className="lg:w-70" />
      </div>

      {usersQ.isPending && <p className="text-sm text-gray-500">Loading users...</p>}
      {usersQ.isError && <p className="text-sm text-gray-500">We couldn't load the users. Please try again.</p>}
      {usersQ.isSuccess && list.length === 0 && <p className="text-sm text-gray-500">No users match.</p>}

      {list.length > 0 && (
        <>
          <div className={tableBox}>
            <table className="w-full text-left text-sm text-ink">
              <thead className={theadClass}>
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Email</th>
                  <th className={th}>Role</th>
                  <th className={th}>Joined</th>
                  <th className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u._id} className={rowClass}>
                    <td className={td}>
                      <span className="mr-2 font-semibold">{u.name}</span>
                      {u.active === false && <DeactivatedTag />}
                    </td>
                    <td className={td}>{u.email}</td>
                    <td className={td}>
                      <RoleTag role={u.role} />
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{joinedOn(u._id)}</td>
                    <td className={td}>{editLink(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 lg:hidden">
            {list.map((u) => (
              <li key={u._id} className={`${cardClass} space-y-1`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold text-ink">{u.name}</p>
                  <div className="flex shrink-0 gap-1.5">
                    {u.active === false && <DeactivatedTag />}
                    <RoleTag role={u.role} />
                  </div>
                </div>
                <p className="break-all text-[13px] text-gray-500">{u.email}</p>
                {editLink(u)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
