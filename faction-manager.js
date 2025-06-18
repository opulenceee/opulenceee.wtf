// Faction Manager with SQLite Database
class FactionManager {
  constructor() {
    // Security Configuration
    this.config = {
      password: "SammyG2024!", // Change this password!
      allowedIPs: [], // Add specific IPs here if needed
      sessionTimeout: 3600000, // 1 hour in milliseconds
    };

    this.db = null;
    this.currentSection = "warehouse";
    this.init();
  }

  async init() {
    this.initParticles();
    await this.initDatabase();
    this.checkSession();
    this.bindEvents();
    this.updateDashboard();
  }

  async initDatabase() {
    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: (file) =>
          `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem("faction_database");
      if (savedDb) {
        const data = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(data);
      } else {
        this.db = new SQL.Database();
        this.createTables();
      }

      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Database initialization failed:", error);
      this.showNotification("Database initialization failed", "warning");
    }
  }

  createTables() {
    // Create withdrawals table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weapon_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create distributions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS distributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_name TEXT NOT NULL,
        weapon_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.saveDatabase();
  }

  saveDatabase() {
    try {
      const data = this.db.export();
      localStorage.setItem(
        "faction_database",
        JSON.stringify(Array.from(data))
      );
    } catch (error) {
      console.error("Failed to save database:", error);
    }
  }

  initParticles() {
    if (typeof particlesJS !== "undefined") {
      particlesJS("particles-js", {
        particles: {
          number: {
            value: 50,
            density: { enable: true, value_area: 1657.2100474277727 },
          },
          color: { value: "#ffffff" },
          shape: {
            type: "circle",
            stroke: { width: 0, color: "#000000" },
            polygon: { nb_sides: 8 },
            image: { src: "img/github.svg", width: 100, height: 100 },
          },
          opacity: {
            value: 0.5,
            random: false,
            anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false },
          },
          size: {
            value: 3,
            random: true,
            anim: { enable: true, speed: 1, size_min: 0.1, sync: true },
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#ffffff",
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: { enable: false, rotateX: 600, rotateY: 1200 },
          },
        },
        interactivity: {
          detect_on: "window",
          events: {
            onhover: { enable: true, mode: "grab" },
            onclick: { enable: false, mode: "push" },
            resize: true,
          },
          modes: {
            grab: { distance: 400, line_linked: { opacity: 1 } },
            bubble: {
              distance: 400,
              size: 40,
              duration: 2,
              opacity: 8,
              speed: 3,
            },
            repulse: { distance: 200, duration: 0.4 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 },
          },
        },
        retina_detect: true,
      });
    }
  }

  checkSession() {
    const isLoggedIn = localStorage.getItem("faction_logged_in");
    const loginTime = localStorage.getItem("faction_login_time");

    if (isLoggedIn && loginTime) {
      const currentTime = Date.now();
      const timeDiff = currentTime - parseInt(loginTime);

      if (timeDiff < this.config.sessionTimeout) {
        this.showMainApp();
        return;
      }
    }

    this.logout();
  }

  async checkIPRestriction() {
    if (this.config.allowedIPs.length === 0) return true;

    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return this.config.allowedIPs.includes(data.ip);
    } catch (error) {
      console.warn("Could not verify IP address");
      return true;
    }
  }

  bindEvents() {
    // Login form
    document
      .getElementById("login-form")
      .addEventListener("submit", (e) => this.handleLogin(e));

    // Navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.switchSection(e.target.dataset.section)
      );
    });

    // Logout
    document
      .getElementById("logout-btn")
      .addEventListener("click", () => this.logout());

    // Member dropdown
    document
      .getElementById("member-name")
      .addEventListener("change", (e) => this.handleMemberSelection(e));

    // Forms
    document
      .getElementById("withdrawal-form")
      .addEventListener("submit", (e) => this.handleWithdrawal(e));
    document
      .getElementById("distribution-form")
      .addEventListener("submit", (e) => this.handleDistribution(e));

    // Database controls
    document
      .getElementById("query-type")
      .addEventListener("change", (e) => this.handleQueryTypeChange(e));
    document
      .getElementById("run-query")
      .addEventListener("click", () => this.runQuery());
    document
      .getElementById("export-results")
      .addEventListener("click", () => this.exportResults());
    document
      .getElementById("delete-selected")
      .addEventListener("click", () => this.deleteSelected());
    document
      .getElementById("backup-db")
      .addEventListener("click", () => this.backupDatabase());
    document
      .getElementById("restore-db")
      .addEventListener("click", () => this.restoreDatabase());
    document
      .getElementById("db-file-input")
      .addEventListener("change", (e) => this.handleFileRestore(e));

    // Statistics controls
    document
      .getElementById("refresh-analytics")
      .addEventListener("click", () => this.updateStatistics());
    document
      .getElementById("analytics-period")
      .addEventListener("change", () => this.updateStatistics());
  }

  async handleLogin(e) {
    e.preventDefault();

    const password = document.getElementById("password-input").value;
    const errorDiv = document.getElementById("login-error");

    const ipAllowed = await this.checkIPRestriction();
    if (!ipAllowed) {
      errorDiv.textContent = "Access denied: IP not authorized";
      return;
    }

    if (password === this.config.password) {
      localStorage.setItem("faction_logged_in", "true");
      localStorage.setItem("faction_login_time", Date.now().toString());
      this.showMainApp();
    } else {
      errorDiv.textContent = "Invalid password";
      document.getElementById("password-input").value = "";
    }
  }

  showMainApp() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    this.updateDashboard();
  }

  logout() {
    localStorage.removeItem("faction_logged_in");
    localStorage.removeItem("faction_login_time");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("main-app").classList.add("hidden");
    document.getElementById("password-input").value = "";
    document.getElementById("login-error").textContent = "";
  }

  switchSection(section) {
    document
      .querySelectorAll(".nav-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelector(`[data-section="${section}"]`)
      .classList.add("active");

    document
      .querySelectorAll(".app-section")
      .forEach((sec) => sec.classList.remove("active"));
    document.getElementById(`${section}-section`).classList.add("active");

    this.currentSection = section;

    if (section === "database") {
      this.updateDatabaseStats();
      this.runQuery(); // Show all records by default
    } else if (section === "statistics") {
      this.updateStatistics();
    }
  }

  handleMemberSelection(e) {
    const customMemberInput = document.getElementById("custom-member-name");

    if (e.target.value === "custom") {
      customMemberInput.style.display = "block";
      customMemberInput.required = true;
    } else {
      customMemberInput.style.display = "none";
      customMemberInput.required = false;
      customMemberInput.value = "";
    }
  }

  handleWithdrawal(e) {
    e.preventDefault();

    const weaponType = document.getElementById("gun-type").value;
    const quantity = parseInt(document.getElementById("gun-quantity").value);
    const notes = document.getElementById("withdrawal-notes").value;

    try {
      this.db.run(
        "INSERT INTO withdrawals (weapon_type, quantity, notes) VALUES (?, ?, ?)",
        [weaponType, quantity, notes]
      );

      this.saveDatabase();
      this.addLogEntry("withdrawal", {
        weapon_type: weaponType,
        quantity,
        notes,
        timestamp: new Date().toISOString(),
      });
      this.updateDashboard();

      e.target.reset();
      this.showNotification(
        `✅ Logged withdrawal: ${quantity}x ${weaponType}`,
        "success"
      );
    } catch (error) {
      console.error("Error logging withdrawal:", error);
      this.showNotification("Error logging withdrawal", "warning");
    }
  }

  handleDistribution(e) {
    e.preventDefault();

    const memberDropdown = document.getElementById("member-name").value;
    const customMemberName =
      document.getElementById("custom-member-name").value;
    const memberName =
      memberDropdown === "custom" ? customMemberName : memberDropdown;
    const weaponType = document.getElementById("dist-gun-type").value;
    const quantity = parseInt(document.getElementById("dist-quantity").value);
    const notes = document.getElementById("dist-notes").value;

    try {
      this.db.run(
        "INSERT INTO distributions (member_name, weapon_type, quantity, notes) VALUES (?, ?, ?, ?)",
        [memberName, weaponType, quantity, notes]
      );

      this.saveDatabase();
      this.addLogEntry("distribution", {
        member_name: memberName,
        weapon_type: weaponType,
        quantity,
        notes,
        timestamp: new Date().toISOString(),
      });
      this.updateDashboard();

      e.target.reset();
      this.showNotification(
        `✅ Logged distribution: ${quantity}x ${weaponType} to ${memberName}`,
        "success"
      );
    } catch (error) {
      console.error("Error logging distribution:", error);
      this.showNotification("Error logging distribution", "warning");
    }
  }

  addLogEntry(type, data) {
    const logContainer = document.getElementById(`${type}-log`);

    const entry = document.createElement("div");
    entry.className = "log-entry";

    const time = new Date(data.timestamp).toLocaleString();

    let content = "";
    if (type === "withdrawal") {
      content = `
        <div class="log-info">
          <div class="log-type">📥 Withdrawal</div>
          <div class="log-details">${data.quantity}x ${data.weapon_type}${
        data.notes ? ` - ${data.notes}` : ""
      }</div>
        </div>
        <div class="log-time">${time}</div>
      `;
    } else if (type === "distribution") {
      content = `
        <div class="log-info">
          <div class="log-type">📊 Distribution</div>
          <div class="log-details">${data.quantity}x ${data.weapon_type} → ${
        data.member_name
      }${data.notes ? ` - ${data.notes}` : ""}</div>
        </div>
        <div class="log-time">${time}</div>
      `;
    }

    entry.innerHTML = content;
    logContainer.insertBefore(entry, logContainer.firstChild);

    // Keep only last 20 entries visible
    const entries = logContainer.querySelectorAll(".log-entry");
    if (entries.length > 20) {
      entries[entries.length - 1].remove();
    }
  }

  updateDashboard() {
    try {
      // Get total withdrawals
      const withdrawalResult = this.db.exec(
        "SELECT SUM(quantity) as total FROM withdrawals"
      );
      const totalGuns = withdrawalResult[0]
        ? withdrawalResult[0].values[0][0] || 0
        : 0;

      // Get total distributions
      const distributionResult = this.db.exec(
        "SELECT SUM(quantity) as total FROM distributions"
      );
      const totalDistributed = distributionResult[0]
        ? distributionResult[0].values[0][0] || 0
        : 0;

      document.getElementById("total-guns").textContent =
        totalGuns.toLocaleString();
      document.getElementById(
        "total-value"
      ).textContent = `${totalDistributed.toLocaleString()} distributed`;

      this.loadRecentEntries();
    } catch (error) {
      console.error("Error updating dashboard:", error);
    }
  }

  loadRecentEntries() {
    try {
      // Load recent withdrawals
      const recentWithdrawals = this.db.exec(
        "SELECT * FROM withdrawals ORDER BY timestamp DESC LIMIT 10"
      );

      if (recentWithdrawals[0]) {
        document.getElementById("withdrawal-log").innerHTML = "";
        recentWithdrawals[0].values.forEach((row) => {
          const [id, weapon_type, quantity, notes, timestamp] = row;
          this.addLogEntry("withdrawal", {
            weapon_type,
            quantity,
            notes,
            timestamp,
          });
        });
      }

      // Load recent distributions
      const recentDistributions = this.db.exec(
        "SELECT * FROM distributions ORDER BY timestamp DESC LIMIT 10"
      );

      if (recentDistributions[0]) {
        document.getElementById("distribution-log").innerHTML = "";
        recentDistributions[0].values.forEach((row) => {
          const [id, member_name, weapon_type, quantity, notes, timestamp] =
            row;
          this.addLogEntry("distribution", {
            member_name,
            weapon_type,
            quantity,
            notes,
            timestamp,
          });
        });
      }
    } catch (error) {
      console.error("Error loading recent entries:", error);
    }
  }

  // Database Management Functions
  handleQueryTypeChange(e) {
    const customSqlRow = document.getElementById("custom-sql-row");
    if (e.target.value === "custom") {
      customSqlRow.style.display = "block";
    } else {
      customSqlRow.style.display = "none";
    }
  }

  runQuery() {
    const queryType = document.getElementById("query-type").value;
    const filterValue = document.getElementById("filter-value").value;
    const customSql = document.getElementById("custom-sql").value;

    let sql = "";
    let params = [];

    switch (queryType) {
      case "all":
        sql = `
          SELECT 'withdrawal' as type, id, weapon_type, quantity, '' as member_name, notes, timestamp FROM withdrawals
          UNION ALL
          SELECT 'distribution' as type, id, weapon_type, quantity, member_name, notes, timestamp FROM distributions
          ORDER BY timestamp DESC
        `;
        break;
      case "withdrawals":
        sql =
          'SELECT *, "withdrawal" as type FROM withdrawals ORDER BY timestamp DESC';
        break;
      case "distributions":
        sql =
          'SELECT *, "distribution" as type FROM distributions ORDER BY timestamp DESC';
        break;
      case "by-member":
        if (!filterValue) {
          this.showNotification(
            "Please enter a member name to filter",
            "warning"
          );
          return;
        }
        sql =
          'SELECT *, "distribution" as type FROM distributions WHERE member_name LIKE ? ORDER BY timestamp DESC';
        params = [`%${filterValue}%`];
        break;
      case "by-weapon":
        if (!filterValue) {
          this.showNotification(
            "Please enter a weapon type to filter",
            "warning"
          );
          return;
        }
        sql = `
          SELECT 'withdrawal' as type, id, weapon_type, quantity, '' as member_name, notes, timestamp FROM withdrawals WHERE weapon_type LIKE ?
          UNION ALL
          SELECT 'distribution' as type, id, weapon_type, quantity, member_name, notes, timestamp FROM distributions WHERE weapon_type LIKE ?
          ORDER BY timestamp DESC
        `;
        params = [`%${filterValue}%`, `%${filterValue}%`];
        break;
      case "recent":
        sql = `
          SELECT 'withdrawal' as type, id, weapon_type, quantity, '' as member_name, notes, timestamp FROM withdrawals WHERE datetime(timestamp) >= datetime('now', '-30 days')
          UNION ALL
          SELECT 'distribution' as type, id, weapon_type, quantity, member_name, notes, timestamp FROM distributions WHERE datetime(timestamp) >= datetime('now', '-30 days')
          ORDER BY timestamp DESC
        `;
        break;
      case "custom":
        if (!customSql) {
          this.showNotification("Please enter a custom SQL query", "warning");
          return;
        }
        sql = customSql;
        break;
    }

    try {
      const result = this.db.exec(sql, params);
      this.displayQueryResults(result);
    } catch (error) {
      console.error("Query error:", error);
      this.showNotification(`Query error: ${error.message}`, "warning");
    }
  }

  displayQueryResults(result) {
    const tableContainer = document.getElementById("results-table");

    if (!result[0]) {
      tableContainer.innerHTML = "<p>No results found.</p>";
      return;
    }

    const { columns, values } = result[0];

    let html = '<table class="results-table-element"><thead><tr>';
    html += '<th><input type="checkbox" id="select-all"></th>';
    columns.forEach((col) => {
      html += `<th>${col}</th>`;
    });
    html += "</tr></thead><tbody>";

    values.forEach((row, index) => {
      html += `<tr><td><input type="checkbox" class="row-select" data-row="${index}"></td>`;
      row.forEach((cell) => {
        html += `<td>${cell || ""}</td>`;
      });
      html += "</tr>";
    });

    html += "</tbody></table>";
    tableContainer.innerHTML = html;

    // Bind select all checkbox
    document.getElementById("select-all").addEventListener("change", (e) => {
      document.querySelectorAll(".row-select").forEach((cb) => {
        cb.checked = e.target.checked;
      });
    });

    this.currentQueryResult = result[0];
  }

  exportResults() {
    if (!this.currentQueryResult) {
      this.showNotification("No query results to export", "warning");
      return;
    }

    const { columns, values } = this.currentQueryResult;

    let csv = columns.join(",") + "\n";
    values.forEach((row) => {
      csv += row.map((cell) => `"${cell || ""}"`).join(",") + "\n";
    });

    this.downloadFile(csv, "query-results.csv", "text/csv");
    this.showNotification("Results exported successfully", "success");
  }

  async deleteSelected() {
    const selectedRows = document.querySelectorAll(".row-select:checked");

    if (selectedRows.length === 0) {
      this.showNotification("No rows selected for deletion", "warning");
      return;
    }

    const confirmed = await this.showModal(
      "Delete Records",
      `Delete ${selectedRows.length} selected records? This cannot be undone!`,
      true
    );

    if (!confirmed) {
      return;
    }

    try {
      selectedRows.forEach((checkbox) => {
        const rowIndex = parseInt(checkbox.dataset.row);
        const rowData = this.currentQueryResult.values[rowIndex];
        const [type, id] = rowData;

        if (type === "withdrawal") {
          this.db.run("DELETE FROM withdrawals WHERE id = ?", [id]);
        } else if (type === "distribution") {
          this.db.run("DELETE FROM distributions WHERE id = ?", [id]);
        }
      });

      this.saveDatabase();
      this.runQuery(); // Refresh results
      this.updateDashboard();
      this.showNotification(
        `Deleted ${selectedRows.length} records`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting records:", error);
      this.showNotification("Error deleting records", "warning");
    }
  }

  updateDatabaseStats() {
    try {
      const withdrawalCount = this.db.exec("SELECT COUNT(*) FROM withdrawals");
      const distributionCount = this.db.exec(
        "SELECT COUNT(*) FROM distributions"
      );

      const totalWithdrawals = withdrawalCount[0]
        ? withdrawalCount[0].values[0][0]
        : 0;
      const totalDistributions = distributionCount[0]
        ? distributionCount[0].values[0][0]
        : 0;
      const totalRecords = totalWithdrawals + totalDistributions;

      const dbSize = new Blob([JSON.stringify(Array.from(this.db.export()))])
        .size;

      document.getElementById("total-records").textContent =
        totalRecords.toLocaleString();
      document.getElementById("db-size").textContent = `${(
        dbSize / 1024
      ).toFixed(1)} KB`;
    } catch (error) {
      console.error("Error updating database stats:", error);
    }
  }

  backupDatabase() {
    try {
      const data = this.db.export();
      const blob = new Blob([data], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faction-database-${
        new Date().toISOString().split("T")[0]
      }.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showNotification("Database backed up successfully", "success");
    } catch (error) {
      console.error("Backup error:", error);
      this.showNotification("Backup failed", "warning");
    }
  }

  restoreDatabase() {
    document.getElementById("db-file-input").click();
  }

  async handleFileRestore(e) {
    const file = e.target.files[0];
    if (!file) return;

    const confirmed = await this.showModal(
      "Restore Database",
      "Restore database from file? This will replace all current data!",
      true
    );

    if (!confirmed) {
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      const SQL = await initSqlJs({
        locateFile: (file) =>
          `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
      });

      this.db = new SQL.Database(data);
      this.saveDatabase();
      this.updateDashboard();
      this.showNotification("Database restored successfully", "success");
    } catch (error) {
      console.error("Restore error:", error);
      this.showNotification("Restore failed", "warning");
    }
  }

  downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Statistics Methods
  updateStatistics() {
    try {
      this.updateQuickStats();
      this.updateMonthlyOverview();
      this.updateDetailedAnalytics();
    } catch (error) {
      console.error("Error updating statistics:", error);
      this.showNotification("Error loading statistics", "warning");
    }
  }

  updateQuickStats() {
    // Get current month data
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const monthlyDistributions = this.db.exec(
      `
      SELECT SUM(quantity) as total FROM distributions 
      WHERE strftime('%Y-%m', timestamp) = ?
    `,
      [currentMonth]
    );

    const monthlyTotal = monthlyDistributions[0]
      ? monthlyDistributions[0].values[0][0] || 0
      : 0;

    // Get top member this month
    const topMemberQuery = this.db.exec(
      `
      SELECT member_name, SUM(quantity) as total FROM distributions 
      WHERE strftime('%Y-%m', timestamp) = ?
      GROUP BY member_name 
      ORDER BY total DESC 
      LIMIT 1
    `,
      [currentMonth]
    );

    const topMember =
      topMemberQuery[0] && topMemberQuery[0].values[0]
        ? topMemberQuery[0].values[0][0]
        : "-";

    // Get most popular weapon this month
    const topWeaponQuery = this.db.exec(
      `
      SELECT weapon_type, SUM(quantity) as total FROM distributions 
      WHERE strftime('%Y-%m', timestamp) = ?
      GROUP BY weapon_type 
      ORDER BY total DESC 
      LIMIT 1
    `,
      [currentMonth]
    );

    const topWeapon =
      topWeaponQuery[0] && topWeaponQuery[0].values[0]
        ? topWeaponQuery[0].values[0][0]
        : "-";

    // Update quick stats display
    document.getElementById(
      "monthly-total"
    ).textContent = `${monthlyTotal} guns`;
    document.getElementById("top-member").textContent = topMember;
    document.getElementById("top-weapon").textContent = topWeapon;
  }

  updateMonthlyOverview() {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Top Recipients This Month
    const topRecipientsQuery = this.db.exec(
      `
      SELECT member_name, SUM(quantity) as total FROM distributions 
      WHERE strftime('%Y-%m', timestamp) = ?
      GROUP BY member_name 
      ORDER BY total DESC 
      LIMIT 10
    `,
      [currentMonth]
    );

    this.renderStatList(
      "top-recipients",
      topRecipientsQuery[0] ? topRecipientsQuery[0].values : [],
      "guns"
    );

    // Most Distributed Weapons This Month
    const topWeaponsQuery = this.db.exec(
      `
      SELECT weapon_type, SUM(quantity) as total FROM distributions 
      WHERE strftime('%Y-%m', timestamp) = ?
      GROUP BY weapon_type 
      ORDER BY total DESC 
      LIMIT 10
    `,
      [currentMonth]
    );

    this.renderStatList(
      "top-weapons",
      topWeaponsQuery[0] ? topWeaponsQuery[0].values : [],
      "distributed"
    );

    // Warehouse Activity This Month
    const warehouseQuery = this.db.exec(
      `
      SELECT weapon_type, SUM(quantity) as total FROM withdrawals 
      WHERE strftime('%Y-%m', timestamp) = ?
      GROUP BY weapon_type 
      ORDER BY total DESC 
      LIMIT 10
    `,
      [currentMonth]
    );

    this.renderStatList(
      "warehouse-stats",
      warehouseQuery[0] ? warehouseQuery[0].values : [],
      "withdrawn"
    );

    // Recent Activity Summary
    const recentActivityData = [
      ["Total Withdrawals", this.getTotalCount("withdrawals", currentMonth)],
      [
        "Total Distributions",
        this.getTotalCount("distributions", currentMonth),
      ],
      [
        "Unique Recipients",
        this.getUniqueCount("distributions", "member_name", currentMonth),
      ],
      [
        "Weapon Types Used",
        this.getUniqueCount("distributions", "weapon_type", currentMonth),
      ],
    ];

    this.renderStatList("activity-summary", recentActivityData, "");
  }

  updateDetailedAnalytics() {
    const period = document.getElementById("analytics-period").value;
    let whereClause = "";
    let params = [];

    if (period !== "all") {
      whereClause = `WHERE datetime(timestamp) >= datetime('now', '-${period} days')`;
    }

    // Member Distribution Rankings
    const memberRankingsQuery = this.db.exec(
      `
      SELECT member_name, SUM(quantity) as total FROM distributions 
      ${whereClause}
      GROUP BY member_name 
      ORDER BY total DESC 
      LIMIT 20
    `,
      params
    );

    this.renderRankingTable(
      "member-rankings",
      memberRankingsQuery[0] ? memberRankingsQuery[0].values : [],
      "member"
    );

    // Weapon Distribution Analysis
    const weaponAnalysisQuery = this.db.exec(
      `
      SELECT weapon_type, SUM(quantity) as total, COUNT(*) as transactions FROM distributions 
      ${whereClause}
      GROUP BY weapon_type 
      ORDER BY total DESC 
      LIMIT 15
    `,
      params
    );

    this.renderRankingTable(
      "weapon-analysis",
      weaponAnalysisQuery[0] ? weaponAnalysisQuery[0].values : [],
      "weapon"
    );
  }

  renderStatList(containerId, data, suffix) {
    const container = document.getElementById(containerId);

    if (!data || data.length === 0) {
      container.innerHTML =
        '<div class="stat-item"><span class="stat-name">No data available</span></div>';
      return;
    }

    let html = "";
    data.forEach(([name, count]) => {
      html += `
        <div class="stat-item">
          <span class="stat-name">${name}</span>
          <span class="stat-count">${count} ${suffix}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  renderRankingTable(containerId, data, type) {
    const container = document.getElementById(containerId);

    if (!data || data.length === 0) {
      container.innerHTML =
        '<div class="ranking-item"><span>No data available</span></div>';
      return;
    }

    let html = "";
    const totalCount = data.reduce((sum, row) => sum + row[1], 0);

    data.forEach(([name, count, transactions], index) => {
      const percentage =
        totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : "0";
      const subtitle =
        type === "weapon" && transactions
          ? `${transactions} transactions`
          : `${percentage}% of total`;

      html += `
        <div class="ranking-item">
          <div class="ranking-position">${index + 1}</div>
          <div class="ranking-details">
            <div class="ranking-name">${name}</div>
            <div class="ranking-subtitle">${subtitle}</div>
          </div>
          <div class="ranking-stats">
            <div class="ranking-count">${count}</div>
            <div class="ranking-percentage">${percentage}%</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  getTotalCount(table, month) {
    const result = this.db.exec(
      `
      SELECT SUM(quantity) as total FROM ${table} 
      WHERE strftime('%Y-%m', timestamp) = ?
    `,
      [month]
    );

    return result[0] ? result[0].values[0][0] || 0 : 0;
  }

  getUniqueCount(table, column, month) {
    const result = this.db.exec(
      `
      SELECT COUNT(DISTINCT ${column}) as count FROM ${table} 
      WHERE strftime('%Y-%m', timestamp) = ?
    `,
      [month]
    );

    return result[0] ? result[0].values[0][0] || 0 : 0;
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "success"
          ? "#4CAF50"
          : type === "warning"
          ? "#ff9800"
          : "#2196F3"
      };
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-family: "JetBrainsMono", monospace;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Modal functionality
  showModal(title, message, isDanger = false) {
    return new Promise((resolve) => {
      const modal = document.getElementById("confirmation-modal");
      const modalTitle = document.getElementById("modal-title");
      const modalMessage = document.getElementById("modal-message");
      const confirmBtn = document.getElementById("modal-confirm-btn");
      const cancelBtn = document.getElementById("modal-cancel-btn");
      const closeBtn = document.getElementById("modal-close-btn");

      // Set modal content
      modalTitle.textContent = title;
      modalMessage.textContent = message;

      // Style confirm button based on danger level
      if (isDanger) {
        confirmBtn.className = "modal-btn modal-btn-primary danger";
      } else {
        confirmBtn.className = "modal-btn modal-btn-primary";
      }

      // Show modal
      modal.classList.add("show");

      // Remove existing event listeners
      const newConfirmBtn = confirmBtn.cloneNode(true);
      const newCancelBtn = cancelBtn.cloneNode(true);
      const newCloseBtn = closeBtn.cloneNode(true);

      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

      // Add new event listeners
      newConfirmBtn.addEventListener("click", () => {
        modal.classList.remove("show");
        resolve(true);
      });

      newCancelBtn.addEventListener("click", () => {
        modal.classList.remove("show");
        resolve(false);
      });

      newCloseBtn.addEventListener("click", () => {
        modal.classList.remove("show");
        resolve(false);
      });

      // Close modal on overlay click
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("show");
          resolve(false);
        }
      });

      // Close modal on Escape key
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          modal.classList.remove("show");
          resolve(false);
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
    });
  }
}

// CSS for notifications and table styling
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .results-table-element {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    background: rgba(40, 40, 40, 0.8);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .results-table-element th,
  .results-table-element td {
    padding: 0.8rem;
    text-align: left;
    border-bottom: 1px solid #555;
    color: #ecf0f1;
  }
  
  .results-table-element th {
    background: rgba(60, 60, 60, 0.8);
    font-weight: bold;
    color: rgb(255, 128, 128);
  }
  
  .results-table-element tr:hover {
    background: rgba(50, 50, 50, 0.6);
  }
  
  .results-controls {
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
  }
  
  .db-query-section,
  .db-results,
  .db-actions {
    background: rgba(22, 22, 22, 0.95);
    border: 1px solid #333;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    backdrop-filter: blur(10px);
  }
  
  .query-controls textarea {
    width: 100%;
    background: rgba(40, 40, 40, 0.8);
    border: 1px solid #555;
    border-radius: 8px;
    color: #ecf0f1;
    font-family: "JetBrainsMono", monospace;
    padding: 0.8rem;
    resize: vertical;
  }
`;
document.head.appendChild(style);

// Initialize the faction manager when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.factionManager = new FactionManager();
});
