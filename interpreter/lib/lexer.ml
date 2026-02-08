(** Lexer for Barbie-lang — tokenizes source code with indentation tracking *)

exception Lexer_error of string

type state = {
  source : string;
  mutable pos : int;
  mutable indent_stack : int list;  (* stack of indentation levels *)
  mutable pending : Token.t list;   (* pending INDENT/DEDENT/NEWLINE tokens *)
  mutable at_line_start : bool;
}

let create source =
  { source; pos = 0; indent_stack = [0]; pending = []; at_line_start = true }

let is_at_end st = st.pos >= String.length st.source

let peek st =
  if is_at_end st then '\000'
  else st.source.[st.pos]

let advance st =
  let c = st.source.[st.pos] in
  st.pos <- st.pos + 1;
  c

let skip_comment st =
  while not (is_at_end st) && peek st <> '\n' do
    ignore (advance st)
  done

let read_string st =
  let buf = Buffer.create 16 in
  let quote = advance st in (* consume opening quote *)
  let rec loop () =
    if is_at_end st then
      raise (Lexer_error "Unterminated string")
    else
      let c = advance st in
      if c = quote then ()
      else if c = '\\' then begin
        if is_at_end st then raise (Lexer_error "Unterminated escape");
        let esc = advance st in
        (match esc with
         | 'n' -> Buffer.add_char buf '\n'
         | 't' -> Buffer.add_char buf '\t'
         | '\\' -> Buffer.add_char buf '\\'
         | c when c = quote -> Buffer.add_char buf c
         | _ -> raise (Lexer_error (Printf.sprintf "Unknown escape: \\%c" esc)));
        loop ()
      end else begin
        Buffer.add_char buf c;
        loop ()
      end
  in
  loop ();
  Token.STRING (Buffer.contents buf)

let read_number st =
  let start = st.pos in
  let is_float = ref false in
  while not (is_at_end st) &&
        (let c = peek st in c >= '0' && c <= '9' || c = '.') do
    if peek st = '.' then is_float := true;
    ignore (advance st)
  done;
  let s = String.sub st.source start (st.pos - start) in
  if !is_float then Token.FLOAT (float_of_string s)
  else Token.INT (int_of_string s)

let read_ident st =
  let start = st.pos in
  while not (is_at_end st) &&
        (let c = peek st in
         (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
         (c >= '0' && c <= '9') || c = '_' || c = '.') do
    ignore (advance st)
  done;
  let word = String.sub st.source start (st.pos - start) in
  match word with
  | "feel" -> Token.FEEL
  | "elif" -> Token.ELIF
  | "else" -> Token.ELSE
  | "keepgoing" -> Token.KEEPGOING
  | "strut" -> Token.STRUT
  | "somanytimes" -> Token.SOMANYTIMES
  | "in" -> Token.IN
  | "runway" -> Token.RUNWAY
  | "kenough" -> Token.KENOUGH
  | "continue" -> Token.CONTINUE
  | "pass" -> Token.PASS
  | "dream" -> Token.DREAM
  | "gift" -> Token.GIFT
  | "glitter" -> Token.GLITTER
  | "dust" -> Token.DUST
  | "and" -> Token.AND
  | "or" -> Token.OR
  | "not" -> Token.NOT
  | "None" -> Token.NONE
  | "Ken.say" -> Token.KEN_SAY
  | s -> Token.IDENT s

let handle_indentation st =
  (* Count leading spaces at start of line *)
  let indent = ref 0 in
  while not (is_at_end st) && peek st = ' ' do
    ignore (advance st);
    incr indent
  done;
  (* Skip blank lines and comment-only lines *)
  if is_at_end st || peek st = '\n' then ()
  else if peek st = '#' then
    skip_comment st
  else begin
    let current = List.hd st.indent_stack in
    if !indent > current then begin
      st.indent_stack <- !indent :: st.indent_stack;
      st.pending <- st.pending @ [Token.INDENT]
    end else begin
      while !indent < List.hd st.indent_stack do
        st.indent_stack <- List.tl st.indent_stack;
        st.pending <- st.pending @ [Token.DEDENT]
      done;
      if !indent <> List.hd st.indent_stack then
        raise (Lexer_error "Inconsistent indentation")
    end
  end

let rec next_token st =
  (* Return any pending tokens first *)
  match st.pending with
  | tok :: rest ->
    st.pending <- rest;
    tok
  | [] ->
    if st.at_line_start && not (is_at_end st) then begin
      st.at_line_start <- false;
      handle_indentation st;
      next_token st
    end
    else if is_at_end st then begin
      (* Emit remaining DEDENTs *)
      while List.hd st.indent_stack <> 0 do
        st.indent_stack <- List.tl st.indent_stack;
        st.pending <- st.pending @ [Token.DEDENT]
      done;
      st.pending <- st.pending @ [Token.EOF];
      next_token st
    end
    else
      let c = peek st in
      match c with
      | ' ' | '\t' | '\r' ->
        ignore (advance st);
        next_token st
      | '\n' ->
        ignore (advance st);
        st.at_line_start <- true;
        Token.NEWLINE
      | '#' ->
        skip_comment st;
        next_token st
      | '"' | '\'' ->
        read_string st
      | '0'..'9' ->
        read_number st
      | 'a'..'z' | 'A'..'Z' | '_' ->
        read_ident st
      | '+' -> ignore (advance st); Token.PLUS
      | '-' -> ignore (advance st); Token.MINUS
      | '/' -> ignore (advance st); Token.SLASH
      | '(' -> ignore (advance st); Token.LPAREN
      | ')' -> ignore (advance st); Token.RPAREN
      | '[' -> ignore (advance st); Token.LBRACKET
      | ']' -> ignore (advance st); Token.RBRACKET
      | ':' -> ignore (advance st); Token.COLON
      | ',' -> ignore (advance st); Token.COMMA
      | '*' ->
        ignore (advance st);
        if not (is_at_end st) && peek st = '*' then
          (ignore (advance st); Token.DOUBLESTAR)
        else Token.STAR
      | '=' ->
        ignore (advance st);
        if not (is_at_end st) && peek st = '=' then
          (ignore (advance st); Token.EQ)
        else Token.ASSIGN
      | '!' ->
        ignore (advance st);
        if not (is_at_end st) && peek st = '=' then
          (ignore (advance st); Token.NEQ)
        else raise (Lexer_error "Unexpected '!'")
      | '<' ->
        ignore (advance st);
        if not (is_at_end st) && peek st = '=' then
          (ignore (advance st); Token.LTE)
        else Token.LT
      | '>' ->
        ignore (advance st);
        if not (is_at_end st) && peek st = '=' then
          (ignore (advance st); Token.GTE)
        else Token.GT
      | c -> raise (Lexer_error (Printf.sprintf "Unexpected character: '%c'" c))

let tokenize source =
  let st = create source in
  let tokens = ref [] in
  let rec loop () =
    let tok = next_token st in
    tokens := tok :: !tokens;
    if tok <> Token.EOF then loop ()
  in
  loop ();
  List.rev !tokens
