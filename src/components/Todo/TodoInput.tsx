import * as React from 'react';
import gql from 'graphql-tag';
import { useMutation } from "@apollo/react-hooks";
import { GET_MY_TODOS } from './TodoPrivateList';
import { GetMyTodosQuery, Insert_TodosMutation, Insert_TodosMutationVariables } from '../../generated/graphql';

const ADD_TODO = gql `
  mutation insert_todos($todo: String!, $isPublic: Boolean!) {
    insert_todos(objects: {title: $todo, is_public: $isPublic}) {
      affected_rows
      returning {
        id
        title
        is_completed
      }
    }
  }
`;

const TodoInput = ({isPublic=false}) => {
  const [todoInput, setTodoInput] = React.useState('');
  // 最初の引数は、addTodo関数を入れること
  const [addTodo] = useMutation<Insert_TodosMutation, Insert_TodosMutationVariables>(ADD_TODO);

  return (
    <form className="formInput" onSubmit={(e) => {
      e.preventDefault();
      // add todo
      addTodo(
        {
          variables: {todo: todoInput, isPublic },
          update(cache, { data }) {
            // do not update cache for public feed
            if (isPublic || !data) {
              return null;
            }
            // readQueryは、キャッシュを常時読み込んでおり、リクエストを送らない
            const getExistingTodos = cache.readQuery<GetMyTodosQuery>({ query: GET_MY_TODOS });
            
            const existingTodos = getExistingTodos ? getExistingTodos.todos : [];
            const newTodo = data.insert_todos!.returning[0];
            // writeQueryはローカルキャッシュのデータを変更することができますが、サーバー上のデータは変更されないことを覚えておくことが重要
            cache.writeQuery<GetMyTodosQuery>({
              query: GET_MY_TODOS,
              data: {todos: [newTodo, ...existingTodos]}
            });
          }
        }
      );
      setTodoInput('');
    }}>
      <input
        className="input"
        placeholder="What needs to be done?"
        value={todoInput}
        onChange={e => (setTodoInput(e.target.value))}
      />
      <i className="inputMarker fa fa-angle-right" />
    </form>
  );
};

export default TodoInput;
