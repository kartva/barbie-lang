(** Recursive descent parser for Barbie-lang *)

exception Parse_error of string

type state = {
  tokens : Token.t array;
  mutable pos : int;
}

let create tokens =
  { tokens = Array.of_list tokens; pos = 0 }

let peek st =
  if st.pos >= Array.length st.tokens then Token.EOF
  else st.tokens.(st.pos)

let advance st =
  let tok = peek st in
  st.pos <- st.pos + 1;
  tok

let expect st expected =
  let tok = advance st in
  if tok <> expected then
    raise (Parse_error
      (Printf.sprintf "Expected %s, got %s"
        (Token.to_string expected) (Token.to_string tok)))

let skip_newlines st =
  while peek st = Token.NEWLINE do ignore (advance st) done

(* ---- Expression parsing (precedence climbing) ---- *)

let rec parse_primary st =
  let atom = match peek st with
    | Token.INT n -> ignore (advance st); Ast.Num (float_of_int n)
    | Token.FLOAT f -> ignore (advance st); Ast.Num f
    | Token.STRING s -> ignore (advance st); Ast.Str s
    | Token.GLITTER -> ignore (advance st); Ast.Bool true
    | Token.DUST -> ignore (advance st); Ast.Bool false
    | Token.NONE -> ignore (advance st); Ast.None
    | Token.LBRACKET ->
      ignore (advance st);
      let elements = parse_comma_exprs st Token.RBRACKET in
      expect st Token.RBRACKET;
      Ast.List elements
    | Token.KEN_SAY ->
      ignore (advance st);
      expect st Token.LPAREN;
      let arg = parse_expr st in
      expect st Token.RPAREN;
      Ast.Call ("Ken.say", [arg])
    | Token.IDENT name ->
      ignore (advance st);
      Ast.Var name
    | Token.LPAREN ->
      ignore (advance st);
      let e = parse_expr st in
      expect st Token.RPAREN;
      e
    | tok ->
      raise (Parse_error
        (Printf.sprintf "Unexpected token in expression: %s"
          (Token.to_string tok)))
  in
  parse_postfix st atom

and parse_postfix st base =
  match peek st with
  | Token.LPAREN ->
    ignore (advance st);
    let args = parse_comma_exprs st Token.RPAREN in
    expect st Token.RPAREN;
    let name = match base with
      | Ast.Var n -> n
      | _ -> raise (Parse_error "Only variables can be called")
    in
    parse_postfix st (Ast.Call (name, args))
  | Token.LBRACKET ->
    ignore (advance st);
    let e = if peek st = Token.COLON then Option.none else Some (parse_expr st) in
    if peek st = Token.COLON then begin
      ignore (advance st);
      let e2 = if peek st = Token.RBRACKET then Option.none else Some (parse_expr st) in
      expect st Token.RBRACKET;
      parse_postfix st (Ast.Slice (base, e, e2))
    end else begin
      match e with
      | Some index ->
        expect st Token.RBRACKET;
        parse_postfix st (Ast.GetItem (base, index))
      | None -> raise (Parse_error "Empty index")
    end
  | _ -> base

and parse_comma_exprs st end_tok =
  if peek st = end_tok then []
  else begin
    let first = parse_expr st in
    let rest = ref [] in
    while peek st = Token.COMMA do
      ignore (advance st);
      if peek st <> end_tok then
        rest := parse_expr st :: !rest
    done;
    first :: List.rev !rest
  end

and parse_unary st =
  match peek st with
  | Token.NOT ->
    ignore (advance st);
    Ast.UnOp (Ast.Not, parse_unary st)
  | Token.MINUS ->
    ignore (advance st);
    Ast.UnOp (Ast.Neg, parse_unary st)
  | _ -> parse_pow st

and parse_pow st =
  let left = parse_primary st in
  if peek st = Token.DOUBLESTAR then begin
    ignore (advance st);
    let right = parse_unary st in  (* right-associative *)
    Ast.BinOp (Ast.Pow, left, right)
  end else left

and parse_mul st =
  let left = ref (parse_unary st) in
  while peek st = Token.STAR || peek st = Token.SLASH do
    let op = if advance st = Token.STAR then Ast.Mul else Ast.Div in
    let right = parse_unary st in
    left := Ast.BinOp (op, !left, right)
  done;
  !left

and parse_add st =
  let left = ref (parse_mul st) in
  while peek st = Token.PLUS || peek st = Token.MINUS do
    let op = if advance st = Token.PLUS then Ast.Add else Ast.Sub in
    let right = parse_mul st in
    left := Ast.BinOp (op, !left, right)
  done;
  !left

and parse_comp st =
  let left = ref (parse_add st) in
  while (match peek st with
         | Token.EQ | Token.NEQ | Token.LT | Token.LTE
         | Token.GT | Token.GTE -> true | _ -> false) do
    let op = match advance st with
      | Token.EQ -> Ast.Eq | Token.NEQ -> Ast.Neq
      | Token.LT -> Ast.Lt | Token.LTE -> Ast.Lte
      | Token.GT -> Ast.Gt | Token.GTE -> Ast.Gte
      | _ -> assert false
    in
    let right = parse_add st in
    left := Ast.BinOp (op, !left, right)
  done;
  !left

and parse_and st =
  let left = ref (parse_comp st) in
  while peek st = Token.AND do
    ignore (advance st);
    let right = parse_comp st in
    left := Ast.BinOp (Ast.And, !left, right)
  done;
  !left

and parse_or st =
  let left = ref (parse_and st) in
  while peek st = Token.OR do
    ignore (advance st);
    let right = parse_and st in
    left := Ast.BinOp (Ast.Or, !left, right)
  done;
  !left

and parse_expr st = parse_or st

(* ---- Statement parsing ---- *)

let rec parse_block st =
  expect st Token.INDENT;
  let stmts = ref [] in
  while peek st <> Token.DEDENT && peek st <> Token.EOF do
    skip_newlines st;
    if peek st <> Token.DEDENT && peek st <> Token.EOF then
      stmts := parse_stmt st :: !stmts
  done;
  (if peek st = Token.DEDENT then ignore (advance st));
  List.rev !stmts

and parse_stmt st =
  skip_newlines st;
  match peek st with
  | Token.FEEL -> parse_feel st
  | Token.KEEPGOING -> parse_keepgoing st
  | Token.SOMANYTIMES -> parse_somanytimes st
  | Token.STRUT -> parse_strut st
  | Token.DREAM -> parse_dream st
  | Token.GIFT ->
    ignore (advance st);
    let e = parse_expr st in
    skip_newlines st;
    Ast.Gift e
  | Token.KENOUGH ->
    ignore (advance st);
    skip_newlines st;
    Ast.Kenough
  | Token.KENTINUE ->
    ignore (advance st);
    skip_newlines st;
    Ast.Kentinue
  | Token.PASS ->
    ignore (advance st);
    skip_newlines st;
    Ast.Pass
  | Token.IDENT name ->
    ignore (advance st);
    if peek st = Token.ASSIGN then begin
      ignore (advance st);
      let value = parse_expr st in
      skip_newlines st;
      Ast.Assign (name, value)
    end else begin
      (* Back up and parse as expression *)
      st.pos <- st.pos - 1;
      let e = parse_expr st in
      skip_newlines st;
      Ast.Expr e
    end
  | _ ->
    let e = parse_expr st in
    skip_newlines st;
    Ast.Expr e

and parse_feel st =
  (* feel <cond>: <block> (elif <cond>: <block>)* (else: <block>)? *)
  expect st Token.FEEL;
  let cond = parse_expr st in
  expect st Token.COLON;
  skip_newlines st;
  let body = parse_block st in
  let branches = ref [(cond, body)] in
  skip_newlines st;
  while peek st = Token.ELIF do
    ignore (advance st);
    let c = parse_expr st in
    expect st Token.COLON;
    skip_newlines st;
    let b = parse_block st in
    branches := (c, b) :: !branches;
    skip_newlines st
  done;
  let else_body =
    if peek st = Token.ELSE then begin
      ignore (advance st);
      expect st Token.COLON;
      skip_newlines st;
      Some (parse_block st)
    end else Option.none
  in
  Ast.Feel (List.rev !branches, else_body)

and parse_keepgoing st =
  expect st Token.KEEPGOING;
  let cond = parse_expr st in
  expect st Token.COLON;
  skip_newlines st;
  let body = parse_block st in
  Ast.Keepgoing (cond, body)

and parse_somanytimes st =
  expect st Token.SOMANYTIMES;
  let count = parse_expr st in
  expect st Token.COLON;
  skip_newlines st;
  let body = parse_block st in
  Ast.Somanytimes (count, body)

and parse_strut st =
  expect st Token.STRUT;
  let var = match advance st with
    | Token.IDENT s -> s
    | tok -> raise (Parse_error
        (Printf.sprintf "Expected variable name after 'strut', got %s"
          (Token.to_string tok)))
  in
  expect st Token.IN;
  expect st Token.RUNWAY;
  expect st Token.LPAREN;
  let count = parse_expr st in
  expect st Token.RPAREN;
  expect st Token.COLON;
  skip_newlines st;
  let body = parse_block st in
  Ast.Strut (var, count, body)

and parse_dream st =
  expect st Token.DREAM;
  let name = match advance st with
    | Token.IDENT s -> s
    | _ -> raise (Parse_error "Expected function name")
  in
  expect st Token.LPAREN;
  let params = ref [] in
  if peek st <> Token.RPAREN then begin
    params := (match advance st with
      | Token.IDENT s -> s
      | _ -> raise (Parse_error "Expected parameter name")) :: !params;
    while peek st = Token.COMMA do
      ignore (advance st);
      params := (match advance st with
        | Token.IDENT s -> s
        | _ -> raise (Parse_error "Expected parameter name")) :: !params
    done
  end;
  expect st Token.RPAREN;
  expect st Token.COLON;
  skip_newlines st;
  let body = parse_block st in
  Ast.Dream (name, List.rev !params, body)

let parse tokens =
  let st = create tokens in
  let stmts = ref [] in
  skip_newlines st;
  while peek st <> Token.EOF do
    stmts := parse_stmt st :: !stmts;
    skip_newlines st
  done;
  List.rev !stmts
