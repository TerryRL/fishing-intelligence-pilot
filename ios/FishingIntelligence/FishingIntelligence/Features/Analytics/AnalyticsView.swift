import Charts
import SwiftUI

private enum AnalysisMode: String, CaseIterable, Identifiable {
    case all = "All History"
    case lake = "Lake Success"
    case year = "Annual Success"
    case lakeYear = "Lake / Year"
    var id: String { rawValue }
}

private enum RankingMetric: String, CaseIterable, Identifiable {
    case casts = "Casts"
    case bites = "Bites"
    case catches = "Catches"
    case activity = "Bites + Catches"
    case bitePercent = "% Bites / Casts"
    case catchPercent = "% Catches / Casts"
    case activityPercent = "% Activity / Casts"
    var id: String { rawValue }

    func value(_ row: LureRankingRow) -> Double {
        switch self {
        case .casts: Double(row.casts)
        case .bites: Double(row.bites)
        case .catches: Double(row.catches)
        case .activity: Double(row.activity)
        case .bitePercent: row.bitePercent
        case .catchPercent: row.catchPercent
        case .activityPercent: row.activityPercent
        }
    }
}

struct AnalyticsView: View {
    @EnvironmentObject private var app: AppModel
    @State private var mode: AnalysisMode = .all
    @State private var lakeID: UUID?
    @State private var year: Int?
    @State private var chartMetric: RankingMetric = .activity
    @State private var sortMetric: RankingMetric = .activity
    @State private var ascending = false

    private var years: [Int] {
        Array(Set(app.trips.map { Calendar.current.component(.year, from: $0.startedAt) })).sorted(by: >)
    }

    private var selectedTrips: [FishingTrip] {
        app.trips.filter { trip in
            guard trip.status == .completed else { return false }
            if (mode == .lake || mode == .lakeYear), let lakeID, trip.waterBodyID != lakeID { return false }
            if (mode == .year || mode == .lakeYear), let year,
               Calendar.current.component(.year, from: trip.startedAt) != year { return false }
            return true
        }
    }

    private var rows: [LureRankingRow] {
        AnalyticsEngine.lureRanking(
            events: app.events,
            catches: app.catches,
            lures: app.lures,
            allowedTripIDs: Set(selectedTrips.map(\.id))
        )
    }

    private var sortedRows: [LureRankingRow] {
        rows.sorted {
            let lhs = sortMetric.value($0)
            let rhs = sortMetric.value($1)
            return ascending ? lhs < rhs : lhs > rhs
        }
    }

    // Activity defines the top-ten membership and order so changing the displayed metric
    // never silently swaps lure columns, which makes the chart arithmetic auditable.
    private var chartRows: [LureRankingRow] {
        Array(rows.sorted { $0.activity > $1.activity || ($0.activity == $1.activity && $0.lureName < $1.lureName) }.prefix(10))
    }

    private var totals: ActiveTripStats {
        let ids = Set(selectedTrips.map(\.id))
        return AnalyticsEngine.activeStats(
            events: app.events.filter { ids.contains($0.tripID) },
            catches: app.catches.filter { ids.contains($0.tripID) }
        )
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                filterCard
                summaryCard
                chartCard
                rankingTable
            }
            .padding()
        }
        .navigationTitle("Insights")
    }

    private var filterCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Analysis").font(.headline)
            Picker("Mode", selection: $mode) {
                ForEach(AnalysisMode.allCases) { Text($0.rawValue).tag($0) }
            }
            if mode == .lake || mode == .lakeYear {
                Picker("Lake / waterway", selection: $lakeID) {
                    Text("All waterways").tag(UUID?.none)
                    ForEach(app.waterBodies) { Text($0.name).tag(Optional($0.id)) }
                }
            }
            if mode == .year || mode == .lakeYear {
                Picker("Year", selection: $year) {
                    Text("All years").tag(Int?.none)
                    ForEach(years, id: \.self) { Text(String($0)).tag(Optional($0)) }
                }
            }
        }
        .sectionCard()
    }

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Summary").font(.headline)
            HStack {
                metric("Casts", totals.casts)
                metric("Bites", totals.bites)
                metric("Catches", totals.catches)
                metric("Activity", AnalyticsEngine.interactionCount(bites: totals.bites, catches: totals.catches))
            }
            LabeledContent(
                "Strike → landed conversion",
                value: AnalyticsEngine.landingConversion(bites: totals.bites, catches: totals.catches)
                    .map { $0.formatted(.number.precision(.fractionLength(1))) + "%" } ?? "—"
            )
        }
        .sectionCard()
    }

    private var chartCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Top Lures").font(.title2.bold())
            Picker("Metric", selection: $chartMetric) {
                ForEach(RankingMetric.allCases) { Text($0.rawValue).tag($0) }
            }
            Chart(chartRows) { row in
                BarMark(
                    x: .value("Lure", row.lureName),
                    y: .value(chartMetric.rawValue, chartMetric.value(row))
                )
                .foregroundStyle(.teal.gradient)
                .annotation(position: .top) {
                    Text(chartMetric.value(row).formatted(.number.precision(.fractionLength(0...1))))
                        .font(.caption2)
                }
            }
            .frame(height: 260)
            .chartXAxis {
                AxisMarks { value in
                    AxisValueLabel {
                        if let name = value.as(String.self) {
                            Text(name).font(.caption2).lineLimit(2)
                        }
                    }
                }
            }
            Text("Lure positions stay fixed while you switch metrics.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .sectionCard()
    }

    private var rankingTable: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Lure Ranking").font(.title2.bold())
                Spacer()
                Menu {
                    Picker("Sort", selection: $sortMetric) {
                        ForEach(RankingMetric.allCases) { Text($0.rawValue).tag($0) }
                    }
                    Toggle("Ascending", isOn: $ascending)
                } label: { Label("Sort", systemImage: "arrow.up.arrow.down") }
            }
            ScrollView(.horizontal) {
                Grid(alignment: .leading, horizontalSpacing: 18, verticalSpacing: 10) {
                    GridRow {
                        header("Rank"); header("Lure"); header("Casts"); header("Bites"); header("Catches")
                        header("Activity"); header("Bite %"); header("Catch %"); header("Activity %")
                    }
                    Divider().gridCellColumns(9)
                    ForEach(Array(sortedRows.enumerated()), id: \.element.id) { index, row in
                        GridRow {
                            Text("\(index + 1)")
                            Text(row.lureName).fontWeight(.semibold).frame(minWidth: 120, alignment: .leading)
                            Text("\(row.casts)"); Text("\(row.bites)"); Text("\(row.catches)"); Text("\(row.activity)")
                            percent(row.bitePercent); percent(row.catchPercent); percent(row.activityPercent)
                        }
                        .font(.caption)
                    }
                }
                .padding(.bottom, 4)
            }
        }
        .sectionCard()
    }

    private func metric(_ name: String, _ value: Int) -> some View {
        VStack { Text("\(value)").font(.title3.bold()); Text(name).font(.caption2).foregroundStyle(.secondary) }
            .frame(maxWidth: .infinity)
    }
    private func header(_ text: String) -> some View { Text(text).font(.caption.bold()) }
    private func percent(_ value: Double) -> some View { Text(value.formatted(.number.precision(.fractionLength(1))) + "%") }
}
