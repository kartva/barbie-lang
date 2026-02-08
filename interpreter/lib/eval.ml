(** Interpreter/evaluator for Barbie-lang *)

type value =
  | VNum of float
  | VStr of string
  | VBool of bool
  | VList of value list
  | VFunc of string list * Ast.stmt list * env
  | VNone

and env = value Map.Make(String).t

exception Runtime_error of string
exception Break_signal
exception Kentinue_signal
exception Return_signal of value


module Env = Map.Make(String)

let create_env () : env = Env.empty

let rec value_to_string = function
  | VNum f ->
    if Float.is_integer f then string_of_int (int_of_float f)
    else string_of_float f
  | VStr s -> s
  | VBool true -> "glitter"
  | VBool false -> "dust"
  | VList l -> "[" ^ String.concat ", " (List.map value_to_string l) ^ "]"
  | VFunc _ -> "<dream>"
  | VNone -> "None"

let is_truthy = function
  | VBool false | VNone -> false
  | VNum f when f = 0.0 -> false
  | VStr s when s = "" -> false
  | VList [] -> false
  | _ -> true

let eval_binop op l r =
  match op, l, r with
  (* Arithmetic *)
  | Ast.Add, VNum a, VNum b -> VNum (a +. b)
  | Ast.Add, VStr a, VStr b -> VStr (a ^ b)
  | Ast.Add, VList a, VList b -> VList (a @ b)
  | Ast.Sub, VNum a, VNum b -> VNum (a -. b)
  | Ast.Mul, VNum a, VNum b -> VNum (a *. b)
  | Ast.Mul, VStr s, VNum n -> VStr (String.concat "" (List.init (int_of_float n) (fun _ -> s)))
  | Ast.Div, VNum _, VNum b when b = 0.0 ->
    raise (Runtime_error "Division by zero")
  | Ast.Div, VNum a, VNum b -> VNum (a /. b)
  | Ast.Pow, VNum a, VNum b -> VNum (a ** b)
  (* Comparison *)
  | Ast.Eq, a, b -> VBool (a = b)
  | Ast.Neq, a, b -> VBool (a <> b)
  | Ast.Lt, VNum a, VNum b -> VBool (a < b)
  | Ast.Lte, VNum a, VNum b -> VBool (a <= b)
  | Ast.Gt, VNum a, VNum b -> VBool (a > b)
  | Ast.Gte, VNum a, VNum b -> VBool (a >= b)
  (* Logical *)
  | Ast.And, a, b -> if is_truthy a then b else a
  | Ast.Or, a, b -> if is_truthy a then a else b
  | _ -> raise (Runtime_error "Type error in binary operation")

(** Output buffer — collects all Ken.say output *)
let output_buffer : string list ref = ref []

let reset_output () = output_buffer := []
let get_output () = List.rev !output_buffer

let rec eval_expr (env : env) = function
  | Ast.Num f -> VNum f
  | Ast.Str s -> VStr s
  | Ast.Bool b -> VBool b
  | Ast.None -> VNone
  | Ast.Var name ->
    (match Env.find_opt name env with
     | Some v -> v
     | None -> raise (Runtime_error (Printf.sprintf "Undefined variable: %s" name)))
  | Ast.List exprs -> VList (List.map (eval_expr env) exprs)
  | Ast.UnOp (op, e) ->
    let v = eval_expr env e in
    (match op, v with
     | Ast.Not, _ -> VBool (not (is_truthy v))
     | Ast.Neg, VNum f -> VNum (-. f)
     | _ -> raise (Runtime_error "Type error in unary operation"))
  | Ast.BinOp (op, left, right) ->
    let l = eval_expr env left in
    let r = eval_expr env right in
    eval_binop op l r
  | Ast.GetItem (e, idx) ->
    (match eval_expr env e, eval_expr env idx with
     | VList l, VNum f ->
       let i = int_of_float f in
       let i = if i < 0 then List.length l + i else i in
       if i < 0 || i >= List.length l then raise (Runtime_error "List index out of range")
       else List.nth l i
     | VStr s, VNum f ->
       let i = int_of_float f in
       let i = if i < 0 then String.length s + i else i in
       if i < 0 || i >= String.length s then raise (Runtime_error "String index out of range")
       else VStr (String.make 1 s.[i])
     | _ -> raise (Runtime_error "Indexing requires a list/string and a number"))
  | Ast.Slice (e, start, stop) ->
    (match eval_expr env e with
     | VList l ->
       let len = List.length l in
       let start = match start with Some s -> int_of_float (match eval_expr env s with VNum f -> f | _ -> 0.0) | None -> 0 in
       let stop = match stop with Some s -> int_of_float (match eval_expr env s with VNum f -> f | _ -> 0.0) | None -> len in
       let start = if start < 0 then len + start else start in
       let stop = if stop < 0 then len + stop else stop in
       let start = max 0 (min len start) in
       let stop = max 0 (min len stop) in
       if start >= stop then VList []
       else VList (List.filteri (fun i _ -> i >= start && i < stop) l)
     | VStr s ->
       let len = String.length s in
       let start = match start with Some s -> int_of_float (match eval_expr env s with VNum f -> f | _ -> 0.0) | None -> 0 in
       let stop = match stop with Some s -> int_of_float (match eval_expr env s with VNum f -> f | _ -> 0.0) | None -> len in
       let start = if start < 0 then len + start else start in
       let stop = if stop < 0 then len + stop else stop in
       let start = max 0 (min len start) in
       let stop = max 0 (min len stop) in
       if start >= stop then VStr ""
       else VStr (String.sub s start (stop - start))
     | _ -> raise (Runtime_error "Slicing requires a list or string"))
  | Ast.Call ("Ken.say", args) ->
    let values = List.map (eval_expr env) args in
    let text = String.concat " " (List.map value_to_string values) in
    output_buffer := text :: !output_buffer;
    print_endline text;
    VNone
  | Ast.Call ("len", [arg]) ->
    (match eval_expr env arg with
     | VList l -> VNum (float_of_int (List.length l))
     | VStr s -> VNum (float_of_int (String.length s))
     | _ -> raise (Runtime_error "len() expects a list or string"))
  | Ast.Call (name, args) ->
    (match Env.find_opt name env with
     | Some (VFunc (params, body, closure)) ->
       let values = List.map (eval_expr env) args in
       if List.length params <> List.length values then
         raise (Runtime_error (Printf.sprintf "Function %s expected %d arguments, got %d" name (List.length params) (List.length values)));
       let new_env = List.fold_left2 (fun e p v -> Env.add p v e) closure params values in
       (* Add the function itself to its environment for recursion *)
       let new_env = Env.add name (VFunc (params, body, closure)) new_env in
       (try eval_block new_env body; VNone
        with Return_signal v -> v)
     | _ -> raise (Runtime_error (Printf.sprintf "Unknown function: %s" name)))

and eval_stmt (env : env) (stmt : Ast.stmt) : env =
  match stmt with
  | Ast.Assign (name, expr) ->
    let v = eval_expr env expr in
    Env.add name v env
  | Ast.Expr e ->
    ignore (eval_expr env e);
    env
  | Ast.Feel (branches, else_body) ->
    let rec try_branches = function
      | [] ->
        (match else_body with
         | Some body -> eval_block env body; env
         | None -> env)
      | (cond, body) :: rest ->
        if is_truthy (eval_expr env cond) then
          (eval_block env body; env)
        else
          try_branches rest
    in
    try_branches branches
  | Ast.Keepgoing (cond, body) ->
    let rec loop current_env =
      if is_truthy (eval_expr current_env cond) then
        let next_env =
          try eval_block_to_env current_env body
          with Break_signal -> raise Break_signal
             | Kentinue_signal -> current_env
        in
        loop next_env
      else current_env
    in
    (try loop env with Break_signal -> env)
  | Ast.Somanytimes (count_expr, body) ->
    let count = match eval_expr env count_expr with
      | VNum f -> int_of_float f
      | _ -> raise (Runtime_error "somanytimes expects a number")
    in
    let rec loop current_env i =
      if i < count then
        let next_env =
          try eval_block_to_env current_env body
          with Break_signal -> raise Break_signal
             | Kentinue_signal -> current_env
        in
        loop next_env (i + 1)
      else current_env
    in
    (try loop env 0 with Break_signal -> env)
  | Ast.Strut (var, count_expr, body) ->
    let count = match eval_expr env count_expr with
      | VNum f -> int_of_float f
      | _ -> raise (Runtime_error "runway() expects a number")
    in
    let rec loop current_env i =
      if i < count then
        let env_with_var = Env.add var (VNum (float_of_int i)) current_env in
        let next_env =
          try eval_block_to_env env_with_var body
          with Break_signal -> raise Break_signal
             | Kentinue_signal -> env_with_var
        in
        loop next_env (i + 1)
      else current_env
    in
    (try loop env 0 with Break_signal -> env)
  | Ast.Dream (name, params, body) ->
    (* Functions use lexical scoping, so capture env *)
    let func = VFunc (params, body, env) in
    Env.add name func env
  | Ast.Gift e ->
    let v = eval_expr env e in
    raise (Return_signal v)
  | Ast.Kenough -> raise Break_signal
  | Ast.Kentinue -> raise Kentinue_signal
  | Ast.Pass -> env

and eval_block env stmts =
  ignore (eval_block_to_env env stmts)

and eval_block_to_env env stmts =
  List.fold_left (fun e s -> eval_stmt e s) env stmts

let run (program : Ast.program) =
  let env = create_env () in
  reset_output ();
  eval_block env program;
  get_output ()
