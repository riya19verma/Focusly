import "./App.css";
import { useState } from "react";
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';

function CreateNew() {
  const [levels, setLevels] = useState([
    { id: 1, text: "", children: [] }
  ]);

  // Add at root level
  const addSubLevel = () => {
    setLevels([
      ...levels,
      { id: Date.now(), text: "", children: [] }
    ]);
  };

  // Add child to a specific node
  const addGoal = (id: number) => {
    const addChild = (nodes: any[]): any[] =>
      //searches through the current level for the node with node.id == id
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            children: [
              // add the new child
              ...node.children,
              { id: Date.now(), text: "", children: [] }
            ]
          };
        }
        return {
          //if no such node on current level then go deeper
          ...node,
          children: addChild(node.children)//recursive call
        };
      });

    setLevels(addChild(levels));
  };

  const renderLevels = (nodes: any[], level: number = 1) => {
    return nodes.map(node => (
      //Level of current node is determined by the number of children it has. If it has children, we check the first child's children to determine the level. If it doesn't have children, it's a Level 1 node.
      <div key={node.id} className={`Level${level}`}>
        <input type="text" />

        {level == 4? <></>:<IconButton color="primary" aria-label="add" className="Add" onClick={() => addGoal(node.id)}>
          <AddIcon />
        </IconButton>}

        {node.children.length > 0 && renderLevels(node.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="create-new-container">
      <h2>Lets Plan something New !!</h2>
      <div className="add-root-button-container">
        {renderLevels(levels,1)}
      </div>
    </div>
  );
}

export default CreateNew;