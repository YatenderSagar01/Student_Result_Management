const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

async function api(path, method = "GET", body) {
  const r = await fetch("/api/" + path, {method, headers: {"Content-Type": "application/json"}, body: body ? JSON.stringify(body) : undefined});
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
const say = (id, text, ok) => { const e = $(id); if (e) { e.textContent = text; e.className = "msg" + (ok ? " ok" : ""); } };

function showSheet(r) {
  $("sheet").innerHTML = `<h2>Semester ${r.student.semester} Marksheet</h2>
  <div class="meta"><div><b>Name:</b> ${esc(r.student.name)}</div><div><b>Roll no:</b> ${esc(r.student.roll)}</div><div><b>Course:</b> BCA</div></div>
  <div class="tw"><table><tr><th>Code</th><th>Subject</th><th>Max</th><th>Obtained</th><th>Grade</th><th>Status</th></tr>
  ${r.rows.map(x => `<tr><td>${esc(x.code)}</td><td>${esc(x.name)}</td><td>${x.max}</td><td>${x.obtained ?? "–"}</td><td>${x.grade ?? "–"}</td><td class="${x.status === "Pass" ? "pass" : x.status === "Fail" ? "fail" : ""}">${x.status}</td></tr>`).join("")}
  <tr><th colspan="2">Total</th><th>${r.max}</th><th>${r.total}</th><th>${r.grade}</th><th>${r.percentage}%</th></tr></table></div>
  <p><b>Result:</b> ${r.complete ? `<span class="${r.passed ? "pass" : "fail"}">${r.passed ? "PASS · " + r.division : "FAIL"}</span>` : "Incomplete: some marks are not entered yet"}</p>`;
  $("sheetcard").hidden = false; $("sheetcard").scrollIntoView({behavior: "smooth"});
}
$("closesheet").onclick = () => $("sheetcard").hidden = true;

$("qbtn").onclick = async () => {
  try { say("qmsg", ""); showSheet(await api("result/" + encodeURIComponent($("qroll").value.trim()))); }
  catch (e) { say("qmsg", e.message); }
};
$("lbtn").onclick = async () => {
  try { await api("login", "POST", {username: $("u").value, password: $("p").value});
    $("home").hidden = true; $("admin").hidden = false; $("logout").hidden = false; tab("dash"); }
  catch (e) { say("lmsg", e.message); }
};
$("logout").onclick = async () => { await api("logout", "POST"); location.reload(); };

const TABS = {dash: "Dashboard", stu: "Students", sub: "Subjects", mk: "Enter marks", res: "All results"};
async function tab(t) {
  $("tabs").innerHTML = Object.entries(TABS).map(([k, v]) => `<button class="${k === t ? "on" : ""}" onclick="tab('${k}')">${v}</button>`).join("");
  $("sheetcard").hidden = true;
  try { $("pane").innerHTML = await VIEWS[t](); if (t === "mk") loadMarks(); }
  catch (e) { $("pane").innerHTML = `<p class="msg">${esc(e.message)}</p>`; }
}
const VIEWS = {
  async dash() {
    const [rs, subs] = await Promise.all([api("results"), api("subjects")]);
    const done = rs.filter(r => r.complete), pass = done.filter(r => r.passed);
    const top = [...done].sort((a, b) => b.percentage - a.percentage)[0];
    return `<div class="stats"><div class="card"><b>${rs.length}</b>Students</div><div class="card"><b>${subs.length}</b>Subjects</div>
    <div class="card"><b>${done.length ? Math.round(pass.length * 100 / done.length) + "%" : "–"}</b>Pass rate</div>
    <div class="card"><b>${top ? top.percentage + "%" : "–"}</b>${top ? "Topper: " + esc(top.student.name) : "Topper"}</div></div>`;
  },
  async stu() {
    const list = await api("students");
    return `<div class="card"><h2>Add student</h2><div class="grid"><div><label>Roll number</label><input id="sr"></div>
    <div><label>Full name</label><input id="sn"></div><div><label>Semester</label><input id="ss" type="number" min="1" max="6" value="6"></div></div>
    <button onclick="addStudent()">Add student</button><p class="msg" id="m"></p></div>
    <div class="card tw"><table><tr><th>Roll</th><th>Name</th><th>Sem</th><th></th></tr>
    ${list.map(s => `<tr><td>${esc(s.roll)}</td><td>${esc(s.name)}</td><td>${s.semester}</td><td><button class="del" onclick="delStudent('${esc(s.roll)}')">Delete</button></td></tr>`).join("") || "<tr><td class='empty'>No students yet. Add the first one above.</td></tr>"}</table></div>`;
  },
  async sub() {
    const list = await api("subjects");
    return `<div class="card"><h2>Add subject</h2><div class="grid"><div><label>Code</label><input id="bc"></div><div><label>Subject name</label><input id="bn"></div>
    <div><label>Max marks</label><input id="bm" type="number" value="100"></div><div><label>Semester</label><input id="bs" type="number" min="1" max="6" value="6"></div></div>
    <button onclick="addSubject()">Add subject</button><p class="msg" id="m"></p></div>
    <div class="card tw"><table><tr><th>Code</th><th>Subject</th><th>Max</th><th>Sem</th><th></th></tr>
    ${list.map(s => `<tr><td>${esc(s.code)}</td><td>${esc(s.name)}</td><td>${s.max_marks}</td><td>${s.semester}</td><td><button class="del" onclick="delSubject('${esc(s.code)}')">Delete</button></td></tr>`).join("")}</table></div>`;
  },
  async mk() {
    const list = await api("students");
    return `<div class="card"><h2>Enter marks</h2><label for="ms">Student</label>
    <select id="ms" onchange="loadMarks()">${list.map(s => `<option value="${esc(s.roll)}">${esc(s.roll)} – ${esc(s.name)}</option>`).join("")}</select>
    <div id="mf"></div><p class="msg" id="m"></p></div>`;
  },
  async res() {
    const rs = await api("results");
    return `<div class="card tw"><h2>All results</h2><table><tr><th>Roll</th><th>Name</th><th>Total</th><th>%</th><th>Grade</th><th>Result</th><th></th></tr>
    ${rs.map(r => `<tr><td>${esc(r.student.roll)}</td><td>${esc(r.student.name)}</td><td>${r.total}/${r.max}</td><td>${r.percentage}</td><td>${r.grade}</td>
    <td class="${r.passed ? "pass" : "fail"}">${r.complete ? (r.passed ? "Pass" : "Fail") : "Pending"}</td>
    <td><button class="link" onclick="viewSheet('${esc(r.student.roll)}')">View</button></td></tr>`).join("")}</table></div>`;
  }
};
const act = async (fn, again) => { try { await fn(); tab(again); } catch (e) { say("m", e.message); } };
const addStudent = () => act(() => api("students", "POST", {roll: $("sr").value, name: $("sn").value, semester: $("ss").value}), "stu");
const delStudent = r => confirm("Delete " + r + " and their marks?") && act(() => api("students/" + encodeURIComponent(r), "DELETE"), "stu");
const addSubject = () => act(() => api("subjects", "POST", {code: $("bc").value, name: $("bn").value, max_marks: $("bm").value, semester: $("bs").value}), "sub");
const delSubject = c => confirm("Delete subject " + c + "?") && act(() => api("subjects/" + encodeURIComponent(c), "DELETE"), "sub");
const viewSheet = async r => { try { showSheet(await api("marks/" + encodeURIComponent(r))); } catch (e) { alert(e.message); } };
async function loadMarks() {
  const sel = $("ms"); if (!sel || !sel.value) return;
  const r = await api("marks/" + encodeURIComponent(sel.value));
  $("mf").innerHTML = r.rows.map(x => `<label>${esc(x.name)} (max ${x.max})</label><input type="number" min="0" max="${x.max}" data-code="${esc(x.code)}" value="${x.obtained ?? ""}">`).join("")
    + `<button onclick="saveMarks()">Save marks</button>`;
}
async function saveMarks() {
  const body = {}; document.querySelectorAll("#mf input").forEach(i => body[i.dataset.code] = i.value);
  try { await api("marks/" + encodeURIComponent($("ms").value), "PUT", body); say("m", "Marks saved.", true); }
  catch (e) { say("m", e.message); }
}
