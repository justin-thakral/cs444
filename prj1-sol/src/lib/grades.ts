import * as T from './types.js';
import * as E from './errors.js';

// application error codes are defined so that they can be mapped to
// meaningful HTTP 4xx error codes.  In particular, 400 BAD REQUEST,
// 404 NOT FOUND, 409 CONFLICT and 422 UNPROCESSABLE CONTENT.
/** store grades for multiple sections */
export default class Grades {
  // Private instance properties
  private readonly rowAggrFns: Record<string, T.RowAggrFn>; //map row functions
  private readonly colAggrFns: Record<string, T.ColAggrFn>; //^ col
  private students: Record<T.StudentId, T.Student> = {}; //uses a hashmap we can lookup student in O(1)
  private sections: Record<T.SectionId, SectionInfo> = {};

  constructor(
    rowAggrFns: Record<string, T.RowAggrFn>,
    colAggrFns: Record<string, T.ColAggrFn>
  ) {
    this.rowAggrFns = { ...rowAggrFns };
    this.colAggrFns = { ...colAggrFns };
  }

  /** Add or replace a student in this Grades object. */
  addStudent(student: T.Student) {
    this.students[student.id] = student;
  }

  /** add or replace sectionInfo in this Grades object.
   *
   * Errors:
   *   BAD_CONTENT: section contains unknown aggr function name
   */
  addSectionInfo(sectionInfo: T.SectionInfo): E.Result<void, E.Err> {
    const processedColHeaders: Record<T.ColId, ColHdr> = {};
    for (const [colId, colSpec] of Object.entries(sectionInfo.colHdrs) as [T.ColId, T.ColHdr][]) { //grab the columns of the sectionInfo
      if ("aggrFnName" in colSpec) { //seee if the function exist...
        const aggregatorFn = this.rowAggrFns[colSpec.aggrFnName];
        if (!aggregatorFn) {
          return E.errResult(
            E.Err.err(`Unknown row aggregation function: ${colSpec.aggrFnName}`, "BAD_CONTENT") //if not error
          );
        }
        processedColHeaders[colId] = { ...colSpec, aggrFn: aggregatorFn }; //if it does apply function We wanna reverse cuz columns go down into rows...
      } else {
        processedColHeaders[colId] = colSpec;
      }
    }
 
    const processedRowHeaders: Record<T.RowId, RowHdr> = {}; //exact same logic applies here..
    for (const [rowId, rowSpec] of Object.entries(sectionInfo.rowHdrs) as [T.RowId, T.RowHdr][]) {
      if ("aggrFnName" in rowSpec) {
        const aggregatorFn = this.colAggrFns[rowSpec.aggrFnName];
        if (!aggregatorFn) {
          return E.errResult(
            E.Err.err(`Unknown column aggregation function: ${rowSpec.aggrFnName}`, "BAD_CONTENT")
          );
        }
        processedRowHeaders[rowId] = { ...rowSpec, aggrFn: aggregatorFn };
      } else {
        processedRowHeaders[rowId] = rowSpec;
      }
    }

    const updatedSectionInfo: SectionInfo = {
      ...sectionInfo, //... grabs all the old SectionInfo but replaces it with our new aggregated rows.. and look at comment below
      colHdrs: processedColHeaders,
      rowHdrs: processedRowHeaders,
      students: {}, //we wanna init the student array too cuz it hasnt been yet and the scores too...
      //  As only once a section is created we will be adding students and therefore their scores...
      scores: {},
    };

    this.sections[sectionInfo.id] = updatedSectionInfo;
    return E.okResult(undefined);
  }

  /** enroll student specified by studentId in section sectionId.  It is
   *  not an error if the student is already enrolled.
   *
   * Errors:
   *   NOT_FOUND: unknown sectionId or studentId.
   */
  enrollStudent(
    sectionId: T.SectionId,
    studentId: T.StudentId
  ): E.Result<void, E.Err> {
    const section = this.sections[sectionId]; //basic error checking... if section dosent exist or student report... if not then add student to section
    if (!section) {
      return E.errResult(E.Err.err("Unknown section", "NOT_FOUND"));
    }
    const student = this.students[studentId];
    if (!student) {
      return E.errResult(E.Err.err("Unknown section", "NOT_FOUND"));
    }
    section.students[studentId] = student; //I added a students map to sections.. This makes it way easier and makes sense for a created sectionInfo. 
    // Youd think the students in the section would be part of the info...
    return E.okResult(undefined);
  }

  /** add or replace score for studentId for assignment given by colId
   *  in section sectionId.
   *
   * Errors:
   *   NOT_FOUND: unknown sectionId, studentId or colId.
   *   BAD_CONTENT: student not enrolled in section, or colId
   *   inappropriate for score.
   */
  addScore( //this is mainly error checking 
    sectionId: T.SectionId,
    studentId: T.StudentId,
    colId: T.ColId,
    score: T.Score
  ): E.Result<void, E.Err> {
    const section = this.sections[sectionId]; //error checking follows enrollStudent logic ill explain any complexities...
    if (!section) {
      return E.errResult(E.Err.err("Unknown section", "NOT_FOUND"));
    }
    const student = this.students[studentId];
    if (!student) { //unsure why this needs to be an error test.. if a student is unknown, it cannot possible be enrolled because we error check there. 
    // But it is a test so i add it...
      return E.errResult(E.Err.err("Unknown student", "NOT_FOUND"));
    }
    if (!section.students[studentId]) {
      return E.errResult(E.Err.err("Student not enrolled in section", "BAD_CONTENT"));
    }
    const colDef = section.colHdrs[colId];
    if (!colDef) {
      return E.errResult(E.Err.err("Unknown assignment", "NOT_FOUND"));
    }

    if (colDef._tag !== "numScore" && colDef._tag !== "textScore") { 
      return E.errResult(E.Err.err("Column is not suitable for a score", "BAD_CONTENT"));
    }
    if (colDef._tag === "numScore") {
      if (score !== null && typeof score !== "number") {
        return E.errResult(E.Err.err("Score must be a number or null", "BAD_CONTENT"));
      }
      if (
        score !== null &&
        (score < colDef.min || score > colDef.max) //range checking...
      ) {
        return E.errResult(
          E.Err.err(`Score out of range (${colDef.min}-${colDef.max})`, "BAD_CONTENT")
        );
      }
    }
    if (colDef._tag === "textScore") {
      if (score !== null && typeof score !== "string") {
        return E.errResult(E.Err.err("Score must be a string or null", "BAD_CONTENT"));
      }
      if (score !== null && !colDef.vals.includes(score)) {
        return E.errResult(E.Err.err("Invalid score value", "BAD_CONTENT"));
      }
    }
    //scores work with 2 maps... we map scores to student id then the col id... This works well for O(1) lookup and logic makes sense,
    //  student then hw1, score, example could be jthakra1,pj1,97(3 late point for lateness...)
    if (!section.scores[studentId]) { //we wanna init the map here too could work if you dont init in addInfo too 
      section.scores[studentId] = {};
    }
    section.scores[studentId][colId] = score;

    return E.okResult(undefined);
  }

  /** return entry at [sectionId][rowId][colId].
   *
   *  Errors:
   *    NOT_FOUND: unknown sectionId, rowId or colId.
   *    BAD_CONTENT: rowId is a studentId who is not enrolled in sectionId.
   */
  getEntry( 
    sectionId: T.SectionId,
    rowId: T.RowId,
    colId: T.ColId
  ): E.Result<T.Entry, E.Err> {
    const section = this.sections[sectionId]; //basic error check...
    if (!section) {
      return E.errResult(E.Err.err("Unknown section", "NOT_FOUND"));
    }

    // Validate rowId
    if (T.isStudentId(rowId)) { //make sure this student exist at all the error check logic still makes sense from before where 
    // i said the enrollment checks for unknown already but ill keep the logic consistent...
      
      if (!this.students[rowId]) {
        return E.errResult(E.Err.err("Unknown student", "NOT_FOUND"));
      }
      if (!section.students[rowId]) {
        return E.errResult(E.Err.err("Student not enrolled in section", "BAD_CONTENT"));
      }
    } else {
      if (!section.rowHdrs[rowId]) {
        return E.errResult(E.Err.err("Unknown aggregator row", "NOT_FOUND"));
      }
    }

    // Validate colId
    if (!section.colHdrs[colId]) {
      return E.errResult(E.Err.err("Unknown colId", "NOT_FOUND"));
    }

  
    const fullData = this.buildSectionData(sectionId);   // Builds a SectionData map for all rows  and all columns.  Then we can pick out a cell
    //PLEASE THROUGHLY UNDERSTAND THIS FUNCTION to know how getEntry works... Same  for getSelectionData
    const cell = fullData[rowId][colId]; //we extract a single cell now which is type sectionData
    if (cell instanceof E.Err) {
      return E.errResult(cell);
    }
    return E.okResult(cell);
  }

  /** return full data (including aggregate data) for sectionId.  
   *  If rowIds is non-empty, then only those rows are returned.
   *  If colIds is non-empty, then only those cols are returned.
   *
   *  Sorting: see assignment for details. We'll just keep the order
   *  as best as we can from our data structures.
   *
   * Errors:
   *   NOT_FOUND: unknown sectionId, rowId or colId.
   *   BAD_CONTENT: row specifies a studentId of a known but unenrolled student
   */
  getSectionData( //very similar to getEntry but rather we grab a range of SD from the buildData return rather than the singular SD...
    sectionId: T.SectionId,
    rowIds: T.RowId[] = [],
    colIds: T.ColId[] = []
  ): E.Result<T.SectionData, E.Err> {
    const section = this.sections[sectionId]; //exact same error checking
    if (!section) {
      return E.errResult(E.Err.err("Unknown section", "NOT_FOUND")); 
    }

    // Validate rowIds
    for (const rid of rowIds) {
      if (T.isStudentId(rid)) {
        if (!this.students[rid]) {
          return E.errResult(E.Err.err("Unknown student", "NOT_FOUND"));
        }
        if (!section.students[rid]) {
          return E.errResult(E.Err.err("Student not enrolled in section", "BAD_CONTENT"));
        }
      } else {
        if (!section.rowHdrs[rid]) {
          return E.errResult(E.Err.err("Unknown aggregator row", "NOT_FOUND"));
        }
      }
    }

    // Validate colIds
    for (const cid of colIds) {
      if (!section.colHdrs[cid]) {
        return E.errResult(E.Err.err("Unknown colId", "NOT_FOUND"));
      }
    }

    // If rowIds empty then we have all rows
    if (rowIds.length === 0) {
      rowIds = [
        ...Object.keys(section.students),
        ...Object.keys(section.rowHdrs),
      ] as T.RowId[];
    }
    // Same logic...
    if (colIds.length === 0) {
      colIds = Object.keys(section.colHdrs) as T.ColId[];
    }

    const fullData = this.buildSectionData(sectionId); //get all data
    const resultData: T.SectionData = {}; //pre set a map for all the SDs we need

    // build subset of requested rows/cols based on user request... This is the main difference from getEntry... We are looping to grab all cells 
    //in requested area rather than grabing a single cell..
    for (const rid of rowIds) {
      resultData[rid] = {};
      for (const cid of colIds) {
        resultData[rid][cid] = fullData[rid][cid];
      }
    }

    return E.okResult(resultData);
  }

  /** Builds a SectionData for all rows (student and aggregator) and
   *  all columns (raw and aggregator).  Then we can pick out subsets
   *  in getEntry or getSectionData if needed.
   */
  private buildSectionData(sectionId: T.SectionId): T.SectionData { //this function will do the heavy lifting for entry and selection in 3 main steps... 
  // By giving all SDs and allowing you to choose which you need
  //a good reason to keep this private is so if you have access to your studentId you can build your scores and not see everyone elses for example...
    const section = this.sections[sectionId];
    if (!section) return {}; //left this for safety but shouldnt need it in current implementation because getSelection and entry both test for this already..
  
    const data: T.SectionData = {};
  
    // 1: fill base data for each enrolled student row
    for (const sid of Object.keys(section.students) as T.StudentId[]) {
      data[sid] = {} as T.RowData;
  
      for (const [colId, colHdr] of Object.entries(section.colHdrs) as [T.ColId, ColHdr][]) {
        if (colHdr._tag === "student") {
          const studentHdr = colHdr as T.StudentHdr;
          data[sid][colId] = section.students[sid][studentHdr.key] ?? "";
        } else if (colHdr._tag === "numScore" || colHdr._tag === "textScore") {
          data[sid][colId] = section.scores[sid]?.[colId] ?? null;
        } else {
          // aggregator column will be filled in the follwing lines...
          data[sid][colId] = null;
        }
      }
    }
  
    // 2: fill aggregator columns for each student row
    for (const [colId, colHdr] of Object.entries(section.colHdrs) as [T.ColId, ColHdr][]) {
      if (colHdr._tag === "aggrCol") {
        const aggrCol = colHdr as AggrColHdr;
        for (const sid of Object.keys(section.students) as T.StudentId[]) {
          const aggResult = aggrCol.aggrFn(section, data, sid, aggrCol.args ?? []);
          data[sid][colId] = aggResult.isOk ? aggResult.val : aggResult.err;
        }
      }
    }
  
    // 3: fill aggregator rows
    for (const [arId, rowHdr] of Object.entries(section.rowHdrs) as [T.RowId, RowHdr][]) {
      data[arId] = {} as T.RowData;
  
      for (const [colId, colHdr] of Object.entries(section.colHdrs) as [T.ColId, ColHdr][]) {
        if (colHdr._tag === "student") {
          const studentHdr = colHdr as T.StudentHdr;
          if (studentHdr.key === "id") {
            data[arId][colId] = arId; // aggregator row's ID 
          } else {
            data[arId][colId] = ""; // aggregator rows expect for student columns
          }
        } else {
          const aggrRow = rowHdr as AggrRowHdr;
          const aggResult = aggrRow.aggrFn(section, data, colId, aggrRow.args ?? []);
          data[arId][colId] = aggResult.isOk ? aggResult.val : aggResult.err;
        }
      }
    }
  
    return data;
  }
  
  
  
}

//Next four types are the same as given

type AggrColHdr = T.AggrColHdr & { aggrFn: T.RowAggrFn };
type ColHdr = Exclude<T.ColHdr, T.AggrColHdr> | AggrColHdr;

type AggrRowHdr = T.AggrRowHdr & { aggrFn: T.ColAggrFn };
type RowHdr = Exclude<T.RowHdr, T.AggrRowHdr> | AggrRowHdr;

//i edit section info and explain why in the functions
type SectionInfo = Omit<T.SectionInfo, "colHdrs" | "rowHdrs"> & {
  id: T.SectionId;
  colHdrs: Record<T.ColId, ColHdr>;
  rowHdrs: Record<T.RowId, RowHdr>;
  students: Record<T.StudentId, T.Student>; //see enrollStudent
  scores: Record<T.StudentId, Record<T.ColId, T.Score>>;//see addScore
};